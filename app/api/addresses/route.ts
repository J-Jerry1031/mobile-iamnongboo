import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/phone';
import { asRecord, safeText } from '@/lib/security';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const addresses = await prisma.deliveryAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const body = asRecord(await req.json());
  const label = safeText(body.label, 30) || '배송지';
  const recipient = safeText(body.recipient, 50);
  const phone = normalizePhone(body.phone);
  const zonecode = safeText(body.zonecode, 10) || null;
  const address = safeText(body.address, 300);
  const detail = safeText(body.detail, 200) || null;

  if (!recipient) return NextResponse.json({ message: '받는 분 이름을 입력해주세요.' }, { status: 400 });
  if (!/^01\d{8,9}$/.test(phone)) return NextResponse.json({ message: '연락처를 정확히 입력해주세요.' }, { status: 400 });
  if (!address) return NextResponse.json({ message: '주소를 검색해주세요.' }, { status: 400 });

  const existingCount = await prisma.deliveryAddress.count({ where: { userId: user.id } });
  const shouldDefault = Boolean(body.isDefault) || existingCount === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (shouldDefault) {
      await tx.deliveryAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    return tx.deliveryAddress.create({
      data: {
        userId: user.id,
        label,
        recipient,
        phone,
        zonecode,
        address,
        detail,
        isDefault: shouldDefault,
      },
    });
  });

  return NextResponse.json({ address: created });
}
