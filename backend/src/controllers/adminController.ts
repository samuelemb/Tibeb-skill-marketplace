import { Request, Response, NextFunction } from 'express';
import {
  createAdmin,
  suspendUser,
  unsuspendUser,
  hideJob,
  unhideJob,
  hideProposal,
  unhideProposal,
  hideReview,
  unhideReview,
  holdEscrow,
  releaseEscrow,
  refundEscrow,
  rejectEscrowDispute,
  listJobReports,
  resolveJobReport,
} from '../services/adminService';
import { createAdminSchema } from '../utils/validation';
import { ValidationError } from '../utils/errors';

function requireAdminSecret(req: Request) {
  const secret = process.env.ADMIN_CREATE_SECRET;
  if (!secret) {
    throw new ValidationError('Admin creation is not configured');
  }

  const provided = req.headers['x-admin-secret'];
  if (!provided || provided !== secret) {
    throw new ValidationError('Invalid admin creation secret');
  }
}

export async function createAdminHandler(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdminSecret(req);
    const input = createAdminSchema.parse(req.body);
    const admin = await createAdmin(input);
    res.status(201).json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
}

export async function suspendUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const user = await suspendUser(id, actorId, reason);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function unsuspendUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const user = await unsuspendUser(id, actorId, reason);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function hideJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const job = await hideJob(id, actorId, reason);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function unhideJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const job = await unhideJob(id, actorId, reason);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function hideProposalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const proposal = await hideProposal(id, actorId, reason);
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
}

export async function unhideProposalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const proposal = await unhideProposal(id, actorId, reason);
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
}

export async function hideReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const review = await hideReview(id, actorId, reason);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function unhideReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body || {};
    const review = await unhideReview(id, actorId, reason);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function holdEscrowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { jobId } = req.params;
    const { reason } = req.body || {};
    const escrow = await holdEscrow(jobId, actorId, reason);
    res.status(200).json({ success: true, data: escrow });
  } catch (error) {
    next(error);
  }
}

export async function releaseEscrowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { jobId } = req.params;
    const { reason } = req.body || {};
    const escrow = await releaseEscrow(jobId, actorId, reason);
    res.status(200).json({ success: true, data: escrow });
  } catch (error) {
    next(error);
  }
}

export async function refundEscrowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { jobId } = req.params;
    const { reason } = req.body || {};
    const escrow = await refundEscrow(jobId, actorId, reason);
    res.status(200).json({ success: true, data: escrow });
  } catch (error) {
    next(error);
  }
}

export async function rejectEscrowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { jobId } = req.params;
    const { reason } = req.body || {};
    const escrow = await rejectEscrowDispute(jobId, actorId, reason);
    res.status(200).json({ success: true, data: escrow });
  } catch (error) {
    next(error);
  }
}

export async function listJobReportsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as 'OPEN' | 'RESOLVED' | 'REJECTED' | undefined;
    const reports = await listJobReports(status);
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
}

export async function resolveJobReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorId = (req as any).user.userId;
    const { id } = req.params;
    const { status, reason } = req.body || {};
    if (status !== 'RESOLVED' && status !== 'REJECTED') {
      throw new ValidationError('Status must be RESOLVED or REJECTED');
    }
    const report = await resolveJobReport(id, actorId, status, reason);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}
