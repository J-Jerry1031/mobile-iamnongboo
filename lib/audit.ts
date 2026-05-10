import { prisma } from './prisma';

export async function writeAdminAuditLog({
  adminId,
  action,
  targetType,
  targetId,
  summary,
}: {
  adminId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
}) {
  if (!adminId) return;

  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId: targetId || null,
      summary,
    },
  });
}
