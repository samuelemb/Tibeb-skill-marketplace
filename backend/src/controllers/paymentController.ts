import { Request, Response, NextFunction } from 'express';
import { getDisputeEvidenceUrl } from '../middleware/upload';
import {
  initializeEscrowPayment,
  verifyEscrowPayment,
  getLatestEscrowForJob,
  requestEscrowRefund,
  openEscrowDispute,
  getClientTotalSpent,
} from '../services/paymentService';
import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

/**
 * Initialize escrow payment (Chapa)
 */
export async function initEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { jobId } = req.body;

    const result = await initializeEscrowPayment(jobId, userId, userRole);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify escrow payment (Chapa)
 */
export async function verifyEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { txRef } = req.params;
    const userId = (req as any).user.userId;

    const escrow = await prisma.escrowPayment.findUnique({
      where: { txRef },
    });

    if (!escrow) {
      throw new NotFoundError('Escrow payment not found');
    }

    if (escrow.clientId !== userId) {
      throw new ForbiddenError('You can only verify payments for your own jobs');
    }

    const result = await verifyEscrowPayment(txRef);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get escrow status for a job
 */
export async function getEscrowStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const escrow = await getLatestEscrowForJob(jobId);

    res.status(200).json({
      success: true,
      data: escrow,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request escrow refund (Client only)
 */
export async function refundEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const reason = req.body?.reason as string | undefined;

    const result = await requestEscrowRefund(jobId, userId, userRole, reason);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Open escrow dispute (Client or Freelancer)
 */
export async function disputeEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    if ((req as any).fileValidationError) {
      return res.status(400).json({ success: false, message: (req as any).fileValidationError });
    }
    const { jobId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const reason = req.body?.reason as string | undefined;
    const details = req.body?.details as string | undefined;
    const evidenceFiles = (req.files as Express.Multer.File[] | undefined) || [];
    const evidenceUrls = evidenceFiles
      .map((file) => getDisputeEvidenceUrl(file.filename))
      .filter((url): url is string => Boolean(url));

    const result = await openEscrowDispute(jobId, userId, userRole, reason, details, evidenceUrls);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Chapa webhook handler
 */
export async function chapaWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const txRef = req.body?.tx_ref || req.body?.data?.tx_ref;
    if (txRef) {
      await verifyEscrowPayment(txRef);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const totalSpent = await getClientTotalSpent(userId);

    res.status(200).json({
      success: true,
      data: {
        totalSpent,
      },
    });
  } catch (error) {
    next(error);
  }
}
