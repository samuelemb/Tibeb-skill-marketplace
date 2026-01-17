import { Request, Response, NextFunction } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  publishJob,
  updateJobStatus,
  deleteJob,
} from '../services/jobService';
import { createJobSchema, updateJobSchema, updateJobStatusSchema } from '../utils/validation';
import { JobStatus, JobCategory } from '@prisma/client';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const validatedData = createJobSchema.parse(req.body);
    const job = await createJob(userId, validatedData);

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as JobStatus | undefined;
    const category = req.query.category as JobCategory | undefined;
    const clientId = req.query.clientId as string | undefined;
    const search = req.query.search as string | undefined;
    const minBudget = req.query.minBudget ? parseFloat(req.query.minBudget as string) : undefined;
    const maxBudget = req.query.maxBudget ? parseFloat(req.query.maxBudget as string) : undefined;
    const sortBy = req.query.sortBy as 'relevance' | 'date' | 'budget_asc' | 'budget_desc' | undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const result = await getJobs({
      status,
      category,
      clientId,
      search,
      minBudget,
      maxBudget,
      sortBy,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const job = await getJobById(id);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const validatedData = updateJobSchema.parse(req.body);
    const job = await updateJob(id, userId, userRole, validatedData);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const job = await publishJob(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const validatedData = updateJobStatusSchema.parse(req.body);
    const job = await updateJobStatus(id, userId, userRole, validatedData);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const result = await deleteJob(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

