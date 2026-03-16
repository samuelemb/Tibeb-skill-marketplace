import { NextFunction, Request, Response } from 'express';
import { getSupportChannels, getSupportFaqs } from '../services/supportService';

export async function listFaqs(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const data = await getSupportFaqs(q);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listChannels(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getSupportChannels();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
