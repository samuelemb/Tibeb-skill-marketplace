import { Request, Response, NextFunction } from 'express';
import {
  sendMessage,
  getMessages,
  markMessageAsRead,
  getUnreadMessageCount,
} from '../services/messageService';
import { createMessageSchema } from '../utils/validation';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const validatedData = createMessageSchema.parse(req.body);
    const message = await sendMessage(userId, validatedData);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const jobId = req.query.jobId as string | undefined;
    const contractId = req.query.contractId as string | undefined;
    const conversationWith = req.query.conversationWith as string | undefined;

    const messages = await getMessages(userId, {
      jobId,
      contractId,
      conversationWith,
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const message = await markMessageAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const result = await getUnreadMessageCount(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

