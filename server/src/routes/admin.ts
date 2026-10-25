import { Router, Request, Response } from 'express';
import { prisma } from '../db.ts';
import { requireAuth, requireRole, createAuditLog } from '../middleware/auth.ts';
import { Role, ApplicationStatus } from '@prisma/client';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

// GET /api/v1/admin/stats
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalApplications, totalAppointments, totalEnquiries, programsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.visaApplication.count(),
        prisma.appointment.count(),
        prisma.enquiry.count(),
        prisma.visaProgram.count({ where: { isActive: true } }),
      ]);

    const applicationsByStatus = await prisma.visaApplication.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {};
    applicationsByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.id;
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalApplications,
        totalAppointments,
        totalEnquiries,
        activeVisaPrograms: programsCount,
        statusCounts,
        recentAuditLogs,
      },
    });
  } catch (err) {
    console.error('Fetch admin stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve admin stats.' });
  }
});

// GET /api/v1/admin/users
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;
    const where: any = {};

    if (role && typeof role === 'string' && role !== 'ALL') {
      where.role = role as Role;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        profile: true,
        _count: {
          select: {
            applications: true,
            assignedApplications: true,
            appointmentsAsCustomer: true,
            appointmentsAsConsultant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve users.' });
  }
});

// PATCH /api/v1/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(Role).includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified.' });
    }

    // Protection against self-demoting the logged-in admin (Requirement 12)
    if (id === req.user!.id && role !== Role.ADMIN) {
      return res.status(400).json({
        success: false,
        error: 'Security restriction: You cannot demote your own administrator account.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const previousRole = user.role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_ROLE_MODIFIED',
      resourceType: 'User',
      resourceId: id,
      details: { previousRole, newRole: role, targetEmail: user.email },
      req,
    });

    return res.json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update user role error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update user role.' });
  }
});

// GET /api/v1/admin/consultants
adminRouter.get('/consultants', async (_req: Request, res: Response) => {
  try {
    const consultants = await prisma.user.findMany({
      where: { role: Role.CONSULTANT },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        _count: {
          select: {
            assignedApplications: true,
            appointmentsAsConsultant: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: consultants,
    });
  } catch (err) {
    console.error('Fetch consultants error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve consultants.' });
  }
});

// GET /api/v1/admin/applications
adminRouter.get('/applications', async (req: Request, res: Response) => {
  try {
    const { status, consultantId, search } = req.query;
    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status as ApplicationStatus;
    }

    if (consultantId && typeof consultantId === 'string' && consultantId !== 'ALL') {
      where.assignedConsultantId = consultantId;
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
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        visaProgram: { select: { countryName: true, visaType: true, flowType: true } },
        assignedConsultant: { select: { id: true, firstName: true, lastName: true, email: true } },
        documents: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (err) {
    console.error('Fetch admin applications error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve applications.' });
  }
});

// PATCH /api/v1/admin/applications/:id/assign
adminRouter.patch('/applications/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { consultantId, notes } = req.body;

    if (!consultantId) {
      return res.status(400).json({ success: false, error: 'Consultant ID is required.' });
    }

    const consultant = await prisma.user.findFirst({
      where: { id: consultantId, role: Role.CONSULTANT },
    });

    if (!consultant) {
      return res.status(404).json({ success: false, error: 'Consultant not found or not active.' });
    }

    const application = await prisma.visaApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.visaApplication.update({
        where: { id },
        data: { assignedConsultantId: consultantId },
      });

      await tx.consultantAssignment.create({
        data: {
          applicationId: id,
          consultantId,
          notes: notes || 'Assigned by system administrator.',
        },
      });

      // Internal note
      await tx.internalCaseNote.create({
        data: {
          applicationId: id,
          authorId: req.user!.id,
          note: `Case assigned to consultant ${consultant.firstName} ${consultant.lastName}. ${notes ? `Note: ${notes}` : ''}`,
        },
      });

      return app;
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'APPLICATION_ASSIGNED_TO_CONSULTANT',
      resourceType: 'VisaApplication',
      resourceId: id,
      details: { consultantId, consultantName: `${consultant.firstName} ${consultant.lastName}` },
      req,
    });

    return res.json({
      success: true,
      message: `Case successfully assigned to ${consultant.firstName} ${consultant.lastName}.`,
      data: updated,
    });
  } catch (err) {
    console.error('Assign case error:', err);
    return res.status(500).json({ success: false, error: 'Failed to assign application.' });
  }
});

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { action, resourceType, limit = '50' } = req.query;
    const where: any = {};

    if (action && typeof action === 'string' && action !== 'ALL') {
      where.action = action;
    }

    if (resourceType && typeof resourceType === 'string' && resourceType !== 'ALL') {
      where.resourceType = resourceType;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 200);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs.' });
  }
});
