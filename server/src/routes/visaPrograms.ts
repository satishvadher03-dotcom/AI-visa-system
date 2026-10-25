import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth, requireRole, createAuditLog } from '../middleware/auth.ts';
import { Role } from '@prisma/client';

export const visaProgramsRouter = Router();

// GET /api/v1/visa-programs
visaProgramsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { flow, category, search, includeInactive } = req.query;

    const where: any = {};

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (flow && typeof flow === 'string') {
      where.flowType = flow;
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { countryName: { contains: term } },
        { countryCode: { contains: term } },
        { visaType: { contains: term } },
        { description: { contains: term } },
      ];
    }

    const programs = await prisma.visaProgram.findMany({
      where,
      include: {
        officialSources: true,
        documentRequirements: true,
      },
      orderBy: [{ countryName: 'asc' }, { visaType: 'asc' }],
    });

    return res.json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (err) {
    console.error('Error fetching visa programs:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve visa programs.',
    });
  }
});

// GET /api/v1/visa-programs/:id
visaProgramsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const program = await prisma.visaProgram.findUnique({
      where: { id },
      include: {
        officialSources: true,
        documentRequirements: true,
      },
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Visa program not found.',
      });
    }

    return res.json({
      success: true,
      data: program,
    });
  } catch (err) {
    console.error('Error fetching visa program details:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve visa program details.',
    });
  }
});

const VisaProgramInputSchema = z.object({
  countryCode: z.string().min(2).max(4),
  countryName: z.string().min(2),
  flowType: z.enum(['WORLD_TO_INDIA', 'INDIA_TO_WORLD']),
  visaType: z.string().min(2),
  category: z.string().min(2),
  entryType: z.string().min(2),
  validity: z.string().min(2),
  processingTimeDays: z.number().int().positive(),
  officialFeeUSD: z.number().nonnegative(),
  serviceFeeUSD: z.number().nonnegative(),
  description: z.string().min(10),
  eligibleNationalities: z.string().default('ALL_ELIGIBLE'),
  officialSourceUrl: z.string().url(),
  officialSourceName: z.string().min(2),
  isActive: z.boolean().default(true),
});

// POST /api/v1/visa-programs (Admin only)
visaProgramsRouter.post('/', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const parse = VisaProgramInputSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid program data',
      });
    }

    const created = await prisma.visaProgram.create({
      data: {
        ...parse.data,
        lastVerifiedAt: new Date(),
      },
      include: {
        officialSources: true,
        documentRequirements: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'VISA_PROGRAM_CREATED',
      resourceType: 'VisaProgram',
      resourceId: created.id,
      details: { country: created.countryName, visaType: created.visaType },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Visa program created successfully',
      data: created,
    });
  } catch (err) {
    console.error('Create visa program error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create visa program.',
    });
  }
});

// PUT /api/v1/visa-programs/:id (Admin only)
visaProgramsRouter.put('/:id', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parse = VisaProgramInputSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid update data',
      });
    }

    const updated = await prisma.visaProgram.update({
      where: { id },
      data: {
        ...parse.data,
        lastVerifiedAt: new Date(),
      },
      include: {
        officialSources: true,
        documentRequirements: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'VISA_PROGRAM_UPDATED',
      resourceType: 'VisaProgram',
      resourceId: updated.id,
      details: { country: updated.countryName, visaType: updated.visaType },
      req,
    });

    return res.json({
      success: true,
      message: 'Visa program updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('Update visa program error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update visa program.',
    });
  }
});

// POST /api/v1/visa-programs/:id/requirements (Admin only)
visaProgramsRouter.post('/:id/requirements', requireAuth, requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isMandatory, allowedMimeTypes, maxSizeBytes } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Name and description are required.' });
    }

    const requirement = await prisma.documentRequirement.create({
      data: {
        visaProgramId: id,
        name,
        description,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
        allowedMimeTypes: allowedMimeTypes || 'application/pdf,image/jpeg,image/png',
        maxSizeBytes: maxSizeBytes ? Number(maxSizeBytes) : 5242880,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DOCUMENT_REQUIREMENT_ADDED',
      resourceType: 'DocumentRequirement',
      resourceId: requirement.id,
      details: { visaProgramId: id, name },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Document requirement added',
      data: requirement,
    });
  } catch (err) {
    console.error('Add document requirement error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to add document requirement.',
    });
  }
});
