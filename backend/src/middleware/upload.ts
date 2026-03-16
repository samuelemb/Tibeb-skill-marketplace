import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directories if they don't exist
const avatarDir = path.join(__dirname, '../../uploads/avatars');
const portfolioDir = path.join(__dirname, '../../uploads/portfolio');
const disputeDir = path.join(__dirname, '../../uploads/disputes');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
if (!fs.existsSync(portfolioDir)) {
  fs.mkdirSync(portfolioDir, { recursive: true });
}
if (!fs.existsSync(disputeDir)) {
  fs.mkdirSync(disputeDir, { recursive: true });
}

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-originalname
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Configure storage for portfolio images
const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, portfolioDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Configure storage for dispute evidence
const disputeEvidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, disputeDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Store error in request for controller to handle
    (req as any).fileValidationError = 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.';
    cb(null, false);
  }
};

// File filter for disputes - allow images + PDF
const disputeFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    (req as any).fileValidationError = 'Invalid file type. Only images and PDF files are allowed.';
    cb(null, false);
  }
};

// Configure multer
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

export const uploadPortfolioImage = multer({
  storage: portfolioStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadDisputeEvidence = multer({
  storage: disputeEvidenceStorage,
  fileFilter: disputeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Helper function to get avatar URL from filename
export function getAvatarUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  // Return URL path (frontend will need to serve static files or use cloud storage)
  return `/uploads/avatars/${filename}`;
}

export function getPortfolioImageUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/uploads/portfolio/${filename}`;
}

export function getDisputeEvidenceUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/uploads/disputes/${filename}`;
}

