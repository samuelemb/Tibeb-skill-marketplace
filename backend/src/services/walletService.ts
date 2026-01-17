import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      balance: 0,
    },
  });

  return wallet;
}

export async function getWalletTransactions(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    wallet,
    transactions,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + transactions.length < total,
    },
  };
}
