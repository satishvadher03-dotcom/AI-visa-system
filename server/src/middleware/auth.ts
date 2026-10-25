import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.ts';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'auravisa-default-secure-secret-key-32chars';

export function createSessionToken(user: { id: string; role: string; email: string }): string {
  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string; role: Role; email: string } | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function authenticateToken(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  // Prioritize Authorization: Bearer token (needed in iframes where 3rd-party cookies are blocked)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  } else if (req.cookies?.auravisa_session) {
    token = req.cookies.auravisa_session;
  }

  if (!token) {
    return next();
  }

  let payload = verifySessionToken(token);
  // If Bearer token was invalid, attempt cookie if present
  const cookieToken = req.cookies?.auravisa_session;
  if (!payload && typeof cookieToken === 'string' && token !== cookieToken) {
    token = cookieToken;
    payload = verifySessionToken(cookieToken);
  }

  if (!payload) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (user) {
      req.user = user;
    }
  } catch (err) {
    console.error('Auth middleware user lookup error:', err);
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this resource.',
    });
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Requires one of [${roles.join(', ')}] role. Your role is ${req.user.role}.`,
      });
    }

    next();
  };
}

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || params.req?.user?.id || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.req?.ip || params.req?.socket?.remoteAddress || '127.0.0.1',
        userAgent: params.req?.headers['user-agent'] || 'Unknown',
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
