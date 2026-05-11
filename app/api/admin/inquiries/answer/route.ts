import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { asRecord, safeCuid, safeText } from '@/lib/security';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const body = asRecord(await req.json());
  const inquiryId = safeCuid(body.inquiryId);
  const answer = safeText(body.answer, 2000);
  if (!inquiryId) return NextResponse.json({ message: '문의 ID가 필요해요.' }, { status: 400 });
  if (!answer) return NextResponse.json({ message: '답변 내용을 입력해주세요.' }, { status: 400 });

  const inquiry = await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      answer,
      status: 'ANSWERED',
    },
  });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: 'INQUIRY_ANSWER',
      targetType: 'INQUIRY',
      targetId: inquiry.id,
      summary: `${inquiry.title} 문의 답변 저장`,
    },
  });

  return NextResponse.json(inquiry);
}
