import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db.ts';
import { requireAuth, requireRole, createAuditLog } from '../middleware/auth.ts';
import { documentUpload, getSafeFilePath, PRIVATE_STORAGE_DIR } from '../services/storage.ts';
import { Role, ApplicationStatus, DocumentStatus } from '@prisma/client';

export const applicationsRouter = Router();

const NewApplicationSchema = z.object({
  visaProgramId: z.string().min(1, 'Visa program ID is required'),
  applicantName: z.string().min(2, 'Applicant name is required'),
  applicantPassport: z.string().min(4, 'Passport number is required'),
  travelDate: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/v1/applications (Customer creates application)
applicationsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = NewApplicationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid application data',
      });
    }

    const { visaProgramId, applicantName, applicantPassport, travelDate, passportExpiryDate, notes } = parse.data;

    const visaProgram = await prisma.visaProgram.findUnique({
      where: { id: visaProgramId },
    });

    if (!visaProgram || !visaProgram.isActive) {
      return res.status(404).json({
        success: false,
        error: 'The selected visa program is not available.',
      });
    }

    // Auto-assign an available consultant if one exists
    const availableConsultant = await prisma.user.findFirst({
      where: { role: Role.CONSULTANT },
      orderBy: { createdAt: 'asc' },
    });

    // Generate unique application number
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const applicationNumber = `AV-${new Date().getFullYear()}-${randomSuffix}`;

    const application = await prisma.visaApplication.create({
      data: {
        applicationNumber,
        userId: req.user!.id,
        visaProgramId,
        applicantName,
        applicantPassport: applicantPassport.toUpperCase().trim(),
        travelDate: travelDate ? new Date(travelDate) : null,
        passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : null,
        notes: notes || null,
        status: ApplicationStatus.SUBMITTED,
        assignedConsultantId: availableConsultant?.id || null,
        statusHistory: {
          create: {
            fromStatus: ApplicationStatus.DRAFT,
            toStatus: ApplicationStatus.SUBMITTED,
            changedById: req.user!.id,
            comment: 'Application submitted by customer.',
          },
        },
        assignments: availableConsultant
          ? {
              create: {
                consultantId: availableConsultant.id,
                notes: 'Automatically routed to senior case specialist for initial intake.',
              },
            }
          : undefined,
      },
      include: {
        visaProgram: {
          include: { documentRequirements: true },
        },
        assignedConsultant: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'APPLICATION_SUBMITTED',
      resourceType: 'VisaApplication',
      resourceId: application.id,
      details: { applicationNumber, visaProgramId },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: application,
    });
  } catch (err) {
    console.error('Submit application error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit visa application.',
    });
  }
});

// GET /api/v1/applications/me (Customer view)
applicationsRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const applications = await prisma.visaApplication.findMany({
      where: { userId: req.user!.id },
      include: {
        visaProgram: {
          include: {
            documentRequirements: true,
            officialSources: true,
          },
        },
        documents: true,
        assignedConsultant: {
          select: { firstName: true, lastName: true, email: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (err) {
    console.error('Fetch customer applications error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve applications.',
    });
  }
});

// GET /api/v1/applications/:id (Detailed view with strict ownership check)
applicationsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.visaApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        visaProgram: {
          include: {
            documentRequirements: true,
            officialSources: true,
          },
        },
        documents: {
          include: { requirement: true },
          orderBy: { uploadedAt: 'desc' },
        },
        assignedConsultant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    // Security check: Must be owner, assigned consultant, or admin
    const isOwner = application.userId === req.user!.id;
    const isAssigned = application.assignedConsultantId === req.user!.id;
    const isAdmin = req.user!.role === Role.ADMIN;

    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to view this visa dossier.',
      });
    }

    // Strip internal notes if customer
    const responseData: any = { ...application };
    if (req.user!.role === Role.CUSTOMER) {
      delete responseData.internalNotes;
    }

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error('Fetch application detail error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve application details.',
    });
  }
});

// POST /api/v1/applications/:id/documents (Upload private document)
applicationsRouter.post(
  '/:id/documents',
  requireAuth,
  documentUpload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { requirementId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: 'No document file uploaded.' });
      }

      const application = await prisma.visaApplication.findUnique({
        where: { id },
      });

      if (!application) {
        // Clean up uploaded file if application does not exist
        fs.unlinkSync(file.path);
        return res.status(404).json({ success: false, error: 'Application not found.' });
      }

      // Security check: Only application owner or admin can upload documents
      const isOwner = application.userId === req.user!.id;
      const isAdmin = req.user!.role === Role.ADMIN;

      if (!isOwner && !isAdmin) {
        fs.unlinkSync(file.path);
        return res.status(403).json({
          success: false,
          error: 'Unauthorized. You cannot upload documents for another user’s application.',
        });
      }

      const documentRecord = await prisma.privateDocument.create({
        data: {
          applicationId: application.id,
          userId: req.user!.id,
          requirementId: requirementId || null,
          originalFilename: file.originalname,
          storageFilename: file.filename,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          verificationStatus: DocumentStatus.PENDING,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        action: 'DOCUMENT_UPLOADED',
        resourceType: 'PrivateDocument',
        resourceId: documentRecord.id,
        details: {
          applicationId: application.id,
          originalFilename: file.originalname,
          sizeBytes: file.size,
          mimeType: file.mimetype,
        },
        req,
      });

      return res.status(201).json({
        success: true,
        message: 'Document uploaded securely and queued for consultant verification.',
        data: documentRecord,
      });
    } catch (err: any) {
      console.error('Document upload error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to process document upload.',
      });
    }
  }
);

// GET /api/v1/applications/documents/:docId/download (Secure authenticated download)
applicationsRouter.get('/documents/:docId/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;

    const doc = await prisma.privateDocument.findUnique({
      where: { id: docId },
      include: {
        application: true,
      },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    // Strict access control: Customer owner, assigned consultant, or Admin
    const isOwner = doc.userId === req.user!.id;
    const isAssigned = doc.application.assignedConsultantId === req.user!.id;
    const isAdmin = req.user!.role === Role.ADMIN;

    if (!isOwner && !isAssigned && !isAdmin) {
      await createAuditLog({
        userId: req.user!.id,
        action: 'UNAUTHORIZED_DOCUMENT_ACCESS_ATTEMPT',
        resourceType: 'PrivateDocument',
        resourceId: docId,
        details: { attemptedBy: req.user!.email },
        req,
      });
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You do not possess access credentials for this private document.',
      });
    }

    const safePath = getSafeFilePath(doc.storageFilename);
    if (!safePath || !fs.existsSync(safePath)) {
      return res.status(404).json({ success: false, error: 'Physical document file missing on server.' });
    }

    await createAuditLog({
      userId: req.user!.id,
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'PrivateDocument',
      resourceId: doc.id,
      details: { originalFilename: doc.originalFilename },
      req,
    });

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.originalFilename)}"`
    );
    return res.sendFile(safePath);
  } catch (err) {
    console.error('Document download error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to download document.',
    });
  }
});

// DELETE /api/v1/applications/documents/:docId (Delete document)
applicationsRouter.delete('/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;

    const doc = await prisma.privateDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const isOwner = doc.userId === req.user!.id;
    const isAdmin = req.user!.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const safePath = getSafeFilePath(doc.storageFilename);
    if (safePath && fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }

    await prisma.privateDocument.delete({
      where: { id: docId },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DOCUMENT_DELETED',
      resourceType: 'PrivateDocument',
      resourceId: docId,
      details: { originalFilename: doc.originalFilename },
      req,
    });

    return res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (err) {
    console.error('Delete document error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete document.',
    });
  }
});
