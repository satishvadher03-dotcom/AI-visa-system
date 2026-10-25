import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { requireAuth, requireRole, createAuditLog } from '../middleware/auth.ts';
import { Role, AppointmentStatus } from '@prisma/client';

export const appointmentsRouter = Router();

const AppointmentBookingSchema = z.object({
  consultantId: z.string().optional(),
  applicationId: z.string().optional(),
  appointmentDate: z.string(), // ISO date string e.g. "2026-11-05"
  timeSlot: z.string().min(3),
  purpose: z.string().min(5, 'Purpose is required'),
  notes: z.string().optional(),
});

// GET /api/v1/appointments/slots
appointmentsRouter.get('/slots', async (req: Request, res: Response) => {
  try {
    const { date, consultantId } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, error: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const where: any = {
      appointmentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      },
    };

    if (consultantId && typeof consultantId === 'string') {
      where.consultantId = consultantId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where,
      select: { timeSlot: true, consultantId: true },
    });

    const standardSlots = [
      '09:00 - 09:30 AM',
      '09:30 - 10:00 AM',
      '10:00 - 10:30 AM',
      '10:30 - 11:00 AM',
      '11:00 - 11:30 AM',
      '02:00 - 02:30 PM',
      '02:30 - 03:00 PM',
      '03:00 - 03:30 PM',
      '04:00 - 04:30 PM',
      '04:30 - 05:00 PM',
    ];

    const bookedSlots = new Set(existingAppointments.map((a) => a.timeSlot));
    const availableSlots = standardSlots.map((slot) => ({
      slot,
      isAvailable: !bookedSlots.has(slot),
    }));

    return res.json({
      success: true,
      date,
      slots: availableSlots,
    });
  } catch (err) {
    console.error('Fetch appointment slots error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve available slots.' });
  }
});

// POST /api/v1/appointments (Authenticated or public with account creation)
appointmentsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const parse = AppointmentBookingSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid booking details',
      });
    }

    const { consultantId, applicationId, appointmentDate, timeSlot, purpose, notes } = parse.data;

    const parsedDate = new Date(`${appointmentDate}T12:00:00.000Z`);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid appointment date.' });
    }

    // Check if consultant exists, or auto-assign a consultant
    let assignedConsultantId = consultantId;
    if (!assignedConsultantId) {
      const activeConsultant = await prisma.user.findFirst({
        where: { role: Role.CONSULTANT },
      });
      assignedConsultantId = activeConsultant?.id || undefined;
    }

    // Double-booking check: Prevent booking if consultant already has scheduled appointment at this exact slot and date
    if (assignedConsultantId) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const existingSlot = await prisma.appointment.findFirst({
        where: {
          consultantId: assignedConsultantId,
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          timeSlot,
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
          },
        },
      });

      if (existingSlot) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked for the selected specialist. Please choose an alternative slot.',
        });
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user!.id,
        consultantId: assignedConsultantId || null,
        applicationId: applicationId || null,
        appointmentDate: parsedDate,
        timeSlot,
        purpose,
        notes: notes || null,
        meetingLink: 'https://meet.google.com/auravisa-consular-room',
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        consultant: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'APPOINTMENT_SCHEDULED',
      resourceType: 'Appointment',
      resourceId: appointment.id,
      details: { timeSlot, date: appointmentDate, consultantId: assignedConsultantId },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Consultation appointment scheduled successfully.',
      data: appointment,
    });
  } catch (err) {
    console.error('Book appointment error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule appointment.',
    });
  }
});

// GET /api/v1/appointments/me (Customer view)
appointmentsRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user!.id },
      include: {
        consultant: {
          select: { firstName: true, lastName: true, email: true },
        },
        application: {
          select: { applicationNumber: true, status: true },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return res.json({
      success: true,
      data: appointments,
    });
  } catch (err) {
    console.error('Fetch customer appointments error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve appointments.' });
  }
});

// GET /api/v1/appointments/consultant (Consultant view)
appointmentsRouter.get('/consultant', requireAuth, requireRole(Role.CONSULTANT, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === Role.CONSULTANT) {
      where.consultantId = req.user!.id;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        consultant: {
          select: { firstName: true, lastName: true },
        },
        application: {
          select: { applicationNumber: true, status: true },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    return res.json({
      success: true,
      data: appointments,
    });
  } catch (err) {
    console.error('Fetch consultant appointments error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve appointments.' });
  }
});

// PATCH /api/v1/appointments/:id/status
appointmentsRouter.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Permission check: customer can cancel their own, consultant/admin can update any
    if (req.user!.role === Role.CUSTOMER && appointment.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status as AppointmentStatus,
        notes: notes !== undefined ? notes : appointment.notes,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'APPOINTMENT_STATUS_UPDATED',
      resourceType: 'Appointment',
      resourceId: id,
      details: { newStatus: status },
      req,
    });

    return res.json({
      success: true,
      message: 'Appointment status updated',
      data: updated,
    });
  } catch (err) {
    console.error('Update appointment status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update appointment status.' });
  }
});
