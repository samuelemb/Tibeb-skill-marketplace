import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

type AuditMetadata = Prisma.InputJsonValue | Record<string, unknown>;

export async function recordAuditLog(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: AuditMetadata;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
