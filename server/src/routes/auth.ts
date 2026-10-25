import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { createSessionToken, requireAuth, createAuditLog } from '../middleware/auth.ts';
import { Role } from '@prisma/client';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  nationality: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const ProfileUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  address: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid input data',
      });
    }

    const { email, password, firstName, lastName, phone, nationality } = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // New registrations ALWAYS receive the CUSTOMER role only (Requirement 4)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: Role.CUSTOMER,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim(),
        profile: {
          create: {
            nationality: nationality?.trim() || null,
            preferredLanguage: 'en',
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        profile: true,
      },
    });

    const token = createSessionToken(user);

    // Set secure HttpOnly cookie (compatible with partitioned cross-site iframes)
    res.cookie('auravisa_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.',
    });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email and password.',
      });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = createSessionToken(user);

    res.cookie('auravisa_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      details: { role: user.role },
      req,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profile: user.profile,
    };

    return res.json({
      success: true,
      message: 'Logged in successfully',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during login. Please try again.',
    });
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  if (req.user) {
    await createAuditLog({
      userId: req.user.id,
      action: 'USER_LOGOUT',
      resourceType: 'User',
      resourceId: req.user.id,
      req,
    });
  }

  res.clearCookie('auravisa_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      res.clearCookie('auravisa_session');
      return res.status(401).json({
        success: false,
        error: 'Session invalid or user no longer exists.',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile.',
    });
  }
});

// PATCH /api/v1/auth/profile
authRouter.patch('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = ProfileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid input',
      });
    }

    const data = parseResult.data;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        profile: {
          upsert: {
            create: {
              nationality: data.nationality,
              passportNumber: data.passportNumber,
              address: data.address,
              preferredLanguage: data.preferredLanguage || 'en',
            },
            update: {
              nationality: data.nationality,
              passportNumber: data.passportNumber,
              address: data.address,
              preferredLanguage: data.preferredLanguage,
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        profile: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'PROFILE_UPDATED',
      resourceType: 'UserProfile',
      resourceId: req.user!.id,
      req,
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile.',
    });
  }
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required' });
  }

  // To prevent user enumeration, always respond with success
  return res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  });
});
