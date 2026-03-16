import { Request, Response, NextFunction } from 'express';
import { getContractById, getContractsForUser } from '../services/contractService';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const contracts = await getContractsForUser(userId, userRole);

    res.status(200).json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const contract = await getContractById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    next(error);
  }
}
