import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

function normalizePhone(phone: unknown) {
  return String(phone || '').replaceAll('-', '').replaceAll(' ', '');
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

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

  const body = await req.json();
  const label = normalizeText(body.label) || '배송지';
  const recipient = normalizeText(body.recipient);
  const phone = normalizePhone(body.phone);
  const zonecode = normalizeText(body.zonecode) || null;
  const address = normalizeText(body.address);
  const detail = normalizeText(body.detail) || null;

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
