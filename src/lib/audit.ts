import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Records an administrative change in the audit log. */
export async function logAudit(params: {
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
}) {
  await prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        previousValue: (params.previousValue ?? undefined) as Prisma.InputJsonValue | undefined,
        newValue: (params.newValue ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((e) => console.error("audit log failed", e));
}
