import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Strict CORS and Security Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Auth Token Extractor Middleware
import { authenticateToken } from './server/src/middleware/auth.ts';
app.use(authenticateToken);

// API Route Handlers
import { authRouter } from './server/src/routes/auth.ts';
import { visaProgramsRouter } from './server/src/routes/visaPrograms.ts';
import { eligibilityRouter } from './server/src/routes/eligibility.ts';
import { enquiriesRouter } from './server/src/routes/enquiries.ts';
import { appointmentsRouter } from './server/src/routes/appointments.ts';
import { applicationsRouter } from './server/src/routes/applications.ts';
import { consultantRouter } from './server/src/routes/consultant.ts';
import { adminRouter } from './server/src/routes/admin.ts';
import { aiRouter } from './server/src/routes/ai.ts';

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/visa-programs', visaProgramsRouter);
app.use('/api/v1/eligibility', eligibilityRouter);
app.use('/api/v1/enquiries', enquiriesRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/consultant', consultantRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/ai', aiRouter);

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'AuraVisa Global API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Centralized API 404 Handler
app.all('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// Setup Vite middleware in dev or static files in production
async function setupViteOrStatic() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

// Global Express Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return;
  }
  res.status(err.status || 500).json({
    success: false,
    error: isProduction ? 'An unexpected server error occurred.' : err.message || 'Server error',
  });
});

setupViteOrStatic().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 AuraVisa Global Full-Stack server running on port ${PORT}`);
  });
});
