import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/phone';
import { asRecord, safeCuid, safeText } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit('address-write', 30, 60_000);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const { id: rawId } = await context.params;
  const id = safeCuid(rawId);
  if (!id) return NextResponse.json({ message: '배송지를 찾을 수 없어요.' }, { status: 404 });
  const current = await prisma.deliveryAddress.findFirst({ where: { id, userId: user.id } });
  if (!current) return NextResponse.json({ message: '배송지를 찾을 수 없어요.' }, { status: 404 });

  const body = asRecord(await req.json());
  const data: {
    label?: string;
    recipient?: string;
    phone?: string;
    zonecode?: string | null;
    address?: string;
    detail?: string | null;
    isDefault?: boolean;
  } = {};

  if ('label' in body) data.label = safeText(body.label, 30) || '배송지';
  if ('recipient' in body) {
    data.recipient = safeText(body.recipient, 50);
    if (!data.recipient) return NextResponse.json({ message: '받는 분 이름을 입력해주세요.' }, { status: 400 });
  }
  if ('phone' in body) {
    data.phone = normalizePhone(body.phone);
    if (!/^01\d{8,9}$/.test(data.phone)) return NextResponse.json({ message: '연락처를 정확히 입력해주세요.' }, { status: 400 });
  }
  if ('zonecode' in body) data.zonecode = safeText(body.zonecode, 10) || null;
  if ('address' in body) {
    data.address = safeText(body.address, 300);
    if (!data.address) return NextResponse.json({ message: '주소를 검색해주세요.' }, { status: 400 });
  }
  if ('detail' in body) data.detail = safeText(body.detail, 200) || null;
  if ('isDefault' in body) data.isDefault = Boolean(body.isDefault);

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.deliveryAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    return tx.deliveryAddress.update({
      where: { id },
      data,
    });
  });

  return NextResponse.json({ address: updated });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit('address-write', 30, 60_000);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const { id: rawId } = await context.params;
  const id = safeCuid(rawId);
  if (!id) return NextResponse.json({ message: '배송지를 찾을 수 없어요.' }, { status: 404 });
  const current = await prisma.deliveryAddress.findFirst({ where: { id, userId: user.id } });
  if (!current) return NextResponse.json({ message: '배송지를 찾을 수 없어요.' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.deliveryAddress.delete({ where: { id } });

    if (current.isDefault) {
      const nextDefault = await tx.deliveryAddress.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (nextDefault) {
        await tx.deliveryAddress.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
