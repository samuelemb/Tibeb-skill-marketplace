import { Request, Response, NextFunction } from 'express';
import {
  createProposal,
  getProposals,
  getProposalById,
  sendOffer,
  acceptProposal,
  rejectOffer,
  withdrawProposal,
} from '../services/proposalService';
import { createProposalSchema } from '../utils/validation';
import { ProposalStatus } from '@prisma/client';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const validatedData = createProposalSchema.parse(req.body);
    const proposal = await createProposal(userId, validatedData);

    res.status(201).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.query.jobId as string | undefined;
    const freelancerId = req.query.freelancerId as string | undefined;
    const status = req.query.status as ProposalStatus | undefined;

    const proposals = await getProposals({ jobId, freelancerId, status });

    res.status(200).json({
      success: true,
      data: proposals,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const proposal = await getProposalById(id);

    res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
}

export async function offer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const proposal = await sendOffer(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Offer sent successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const contract = await acceptProposal(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: contract,
      message: 'Offer accepted and contract created',
    });
  } catch (error) {
    next(error);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const proposal = await rejectOffer(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Offer rejected successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const result = await withdrawProposal(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

