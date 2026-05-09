import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const { inquiryId, answer } = await req.json();
  if (!inquiryId) return NextResponse.json({ message: '문의 ID가 필요해요.' }, { status: 400 });
  if (!String(answer || '').trim()) return NextResponse.json({ message: '답변 내용을 입력해주세요.' }, { status: 400 });

  const inquiry = await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      answer: String(answer).trim(),
      status: 'ANSWERED',
    },
  });

  return NextResponse.json(inquiry);
}
