import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth, requireRole, createAuditLog } from '../middleware/auth.ts';
import { Role, ApplicationStatus, DocumentStatus } from '@prisma/client';

export const consultantRouter = Router();

// All consultant routes require CONSULTANT or ADMIN role
consultantRouter.use(requireAuth, requireRole(Role.CONSULTANT, Role.ADMIN));

// GET /api/v1/consultant/assigned-cases
consultantRouter.get('/assigned-cases', async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === Role.CONSULTANT) {
      where.assignedConsultantId = req.user!.id;
    }

    const { status, search } = req.query;
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status as ApplicationStatus;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { applicationNumber: { contains: term } },
        { applicantName: { contains: term } },
        { applicantPassport: { contains: term } },
      ];
    }

    const applications = await prisma.visaApplication.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        visaProgram: { select: { countryName: true, visaType: true, category: true, processingTimeDays: true } },
        documents: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (err) {
    console.error('Fetch assigned cases error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve assigned cases.' });
  }
});

// GET /api/v1/consultant/customers
consultantRouter.get('/customers', async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === Role.CONSULTANT) {
      where.assignedConsultantId = req.user!.id;
    }

    const applications = await prisma.visaApplication.findMany({
      where,
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profile: true,
            createdAt: true,
          },
        },
      },
      distinct: ['userId'],
    });

    const customers = applications.map((a) => a.user);

    return res.json({
      success: true,
      data: customers,
    });
  } catch (err) {
    console.error('Fetch consultant customers error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve customers.' });
  }
});

// PATCH /api/v1/consultant/applications/:id/status
consultantRouter.patch('/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status || !Object.values(ApplicationStatus).includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid application status.' });
    }

    const application = await prisma.visaApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    // Must be assigned consultant or admin
    if (req.user!.role === Role.CONSULTANT && application.assignedConsultantId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You are not the assigned consultant for this case.',
      });
    }

    const previousStatus = application.status;

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.visaApplication.update({
        where: { id },
        data: { status },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: previousStatus,
          toStatus: status,
          changedById: req.user!.id,
          comment: comment || `Status updated to ${status} by consultant.`,
        },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: application.userId,
          title: `Application Status: ${status}`,
          message: comment || `Your application ${application.applicationNumber} status has changed to ${status}.`,
          link: `/customer/applications/${application.id}`,
        },
      });

      return app;
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'APPLICATION_STATUS_UPDATED',
      resourceType: 'VisaApplication',
      resourceId: id,
      details: { fromStatus: previousStatus, toStatus: status, comment },
      req,
    });

    return res.json({
      success: true,
      message: 'Application status updated successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('Update application status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update status.' });
  }
});

// POST /api/v1/consultant/applications/:id/notes
consultantRouter.post('/applications/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ success: false, error: 'Internal note text is required.' });
    }

    const application = await prisma.visaApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (req.user!.role === Role.CONSULTANT && application.assignedConsultantId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden. Not assigned to this case.' });
    }

    const createdNote = await prisma.internalCaseNote.create({
      data: {
        applicationId: id,
        authorId: req.user!.id,
        note: note.trim(),
      },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'INTERNAL_NOTE_ADDED',
      resourceType: 'InternalCaseNote',
      resourceId: createdNote.id,
      details: { applicationId: id },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Internal note recorded.',
      data: createdNote,
    });
  } catch (err) {
    console.error('Add note error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record note.' });
  }
});

// PATCH /api/v1/consultant/documents/:docId/verify
consultantRouter.patch('/documents/:docId/verify', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const { status, rejectionReason } = req.body;

    if (![DocumentStatus.VERIFIED, DocumentStatus.REJECTED].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be VERIFIED or REJECTED.' });
    }

    const doc = await prisma.privateDocument.findUnique({
      where: { id: docId },
      include: { application: true },
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    if (req.user!.role === Role.CONSULTANT && doc.application.assignedConsultantId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden. Not assigned to this case.' });
    }

    const updated = await prisma.privateDocument.update({
      where: { id: docId },
      data: {
        verificationStatus: status,
        rejectionReason: status === DocumentStatus.REJECTED ? rejectionReason || 'Document did not meet government resolution or clarity standards.' : null,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: doc.userId,
        title: status === DocumentStatus.VERIFIED ? 'Document Verified' : 'Document Attention Required',
        message: status === DocumentStatus.VERIFIED
          ? `Your document "${doc.originalFilename}" was verified by your visa consultant.`
          : `Your document "${doc.originalFilename}" was rejected: ${rejectionReason || 'Please re-upload a clearer copy.'}`,
        link: `/customer/applications/${doc.applicationId}`,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DOCUMENT_VERIFICATION_STATUS_CHANGED',
      resourceType: 'PrivateDocument',
      resourceId: docId,
      details: { status, rejectionReason },
      req,
    });

    return res.json({
      success: true,
      message: `Document marked as ${status}.`,
      data: updated,
    });
  } catch (err) {
    console.error('Verify document error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update document verification status.' });
  }
});
