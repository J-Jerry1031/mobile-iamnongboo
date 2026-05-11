import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function writePrivacyAccessLog({
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

  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();

  await prisma.privacyAccessLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId: targetId || null,
      summary,
      ip: forwardedFor || headerList.get('x-real-ip') || null,
      userAgent: headerList.get('user-agent')?.slice(0, 300) || null,
    },
  });
}
