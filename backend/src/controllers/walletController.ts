import { Request, Response, NextFunction } from 'express';
import { getWalletSummary, getWalletTransactions } from '../services/walletService';

export async function getMyWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const summary = await getWalletSummary(userId);

    res.status(200).json({
      success: true,
      data: {
        ...summary.wallet,
        totalEarnings: summary.totalEarnings,
        inEscrowBalance: summary.inEscrowBalance,
        availableBalance: summary.availableBalance,
        totalBalance: summary.totalBalance,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const result = await getWalletTransactions(userId, { limit, offset });

    res.status(200).json({
      success: true,
      data: result.wallet,
      transactions: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
