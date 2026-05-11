import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { asRecord, safeCuid } from '@/lib/security';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const body = asRecord(await req.json());
  const reviewId = safeCuid(body.reviewId);
  const isHidden = Boolean(body.isHidden);

  if (!reviewId) {
    return NextResponse.json({ message: '후기를 찾을 수 없어요.' }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden },
    include: { product: { select: { name: true } } },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: isHidden ? 'REVIEW_HIDE' : 'REVIEW_SHOW',
      targetType: 'REVIEW',
      targetId: review.id,
      summary: `${review.product.name} 후기 ${isHidden ? '숨김' : '노출'}`,
    },
  });

  return NextResponse.json(review);
}
