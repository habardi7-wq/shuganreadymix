import { prisma } from "@/lib/prisma";

interface AuditInput {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

export async function logAudit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeJson: input.before !== undefined ? JSON.stringify(input.before) : null,
      afterJson: input.after !== undefined ? JSON.stringify(input.after) : null,
      ip: input.ip ?? null,
    },
  });
}
