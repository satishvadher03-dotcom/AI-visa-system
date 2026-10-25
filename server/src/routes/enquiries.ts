import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth, requireRole, createAuditLog } from '../middleware/auth.ts';
import { Role, EnquiryStatus } from '@prisma/client';

export const enquiriesRouter = Router();

const EnquirySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  nationality: z.string().min(2, 'Nationality is required'),
  destinationCountry: z.string().min(2, 'Destination country is required'),
  visaType: z.string().min(2, 'Visa type or travel category is required'),
  message: z.string().min(10, 'Please provide details about your travel plans (min 10 characters)'),
});

// POST /api/v1/enquiries (Public or authenticated)
enquiriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parse = EnquirySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid enquiry details',
      });
    }

    const data = parse.data;

    const enquiry = await prisma.enquiry.create({
      data: {
        userId: req.user?.id || null,
        fullName: data.fullName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        nationality: data.nationality,
        destinationCountry: data.destinationCountry,
        visaType: data.visaType,
        message: data.message,
        status: EnquiryStatus.NEW,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'ENQUIRY_SUBMITTED',
      resourceType: 'Enquiry',
      resourceId: enquiry.id,
      details: { destination: enquiry.destinationCountry, visaType: enquiry.visaType },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. A visa specialist will review your request within 24 hours.',
      enquiryId: enquiry.id,
    });
  } catch (err) {
    console.error('Enquiry submission error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit enquiry. Please try again.',
    });
  }
});

// GET /api/v1/enquiries/me (Customer view)
enquiriesRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { email: req.user!.email },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: enquiries,
    });
  } catch (err) {
    console.error('Fetch customer enquiries error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve enquiries.',
    });
  }
});

// GET /api/v1/enquiries (Consultant / Admin view)
enquiriesRouter.get('/', requireAuth, requireRole(Role.CONSULTANT, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { fullName: { contains: term } },
        { email: { contains: term } },
        { destinationCountry: { contains: term } },
      ];
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: enquiries,
    });
  } catch (err) {
    console.error('Fetch all enquiries error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve enquiries.',
    });
  }
});

// PATCH /api/v1/enquiries/:id/status (Consultant / Admin)
enquiriesRouter.patch('/:id/status', requireAuth, requireRole(Role.CONSULTANT, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'ENQUIRY_STATUS_UPDATED',
      resourceType: 'Enquiry',
      resourceId: id,
      details: { newStatus: status },
      req,
    });

    return res.json({
      success: true,
      message: 'Enquiry status updated',
      data: updated,
    });
  } catch (err) {
    console.error('Update enquiry error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update enquiry.',
    });
  }
});
