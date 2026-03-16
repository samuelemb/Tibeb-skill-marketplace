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

export async function getWalletSummary(userId: string) {
  const wallet = await getWallet(userId);

  const [earnings, escrowSummary] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        type: 'CREDIT',
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.escrowPayment.aggregate({
      where: {
        freelancerId: userId,
        refundedAt: null,
        status: { in: ['PAID', 'HELD', 'DISPUTED'] },
      },
      _sum: {
        amount: true,
        platformFee: true,
      },
    }),
  ]);

  const totalEarnings = earnings._sum.amount ? Number(earnings._sum.amount) : 0;
  const escrowAmount = escrowSummary._sum.amount ? Number(escrowSummary._sum.amount) : 0;
  const escrowFees = escrowSummary._sum.platformFee ? Number(escrowSummary._sum.platformFee) : 0;
  const inEscrowBalance = Math.max(0, escrowAmount - escrowFees);
  const availableBalance = Number(wallet.balance) || 0;
  const totalBalance = availableBalance + inEscrowBalance;

  return {
    wallet,
    totalEarnings,
    inEscrowBalance,
    availableBalance,
    totalBalance,
  };
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
