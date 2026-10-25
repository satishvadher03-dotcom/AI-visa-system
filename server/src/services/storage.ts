import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';

// Storage directory strictly outside client public folder
export const PRIVATE_STORAGE_DIR = path.resolve(process.cwd(), 'server', 'storage', 'private_uploads');

if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
  fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
}

// Whitelist of allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRIVATE_STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    const uniqueName = `${crypto.randomUUID()}${safeExt}`;
    cb(null, uniqueName);
  },
});

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB hard limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Invalid file type. Only PDF, JPG, and PNG documents are permitted.'));
    }
    cb(null, true);
  },
});

/**
 * Resolves a file securely within the private storage directory, preventing directory traversal attacks.
 */
export function getSafeFilePath(filename: string): string | null {
  const sanitized = path.basename(filename);
  const resolved = path.resolve(PRIVATE_STORAGE_DIR, sanitized);
  if (!resolved.startsWith(PRIVATE_STORAGE_DIR)) {
    return null;
  }
  return resolved;
}
