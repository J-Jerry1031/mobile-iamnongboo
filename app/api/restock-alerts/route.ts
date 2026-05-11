import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { normalizePhone } from '@/lib/phone';
import { prisma } from '@/lib/prisma';
import { notifyAdmin } from '@/lib/notify';
import { asRecord, safeCuid } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const limited = await rateLimit('restock-alert', 10, 60_000);
  if (limited) return limited;

  const user = await getCurrentUser();
  const body = asRecord(await req.json());
  const productId = safeCuid(body.productId);
  const phone = normalizePhone(body.phone || user?.phone);
  if (!productId) return NextResponse.json({ message: '상품 정보가 올바르지 않아요.' }, { status: 400 });
  if (!/^01\d{8,9}$/.test(phone)) return NextResponse.json({ message: '연락처를 정확히 입력해주세요.' }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ message: '상품을 찾을 수 없어요.' }, { status: 404 });

  const alert = await prisma.restockAlert.upsert({
    where: { productId_phone: { productId, phone } },
    update: { status: 'WAITING', userId: user?.id || null },
    create: { productId, phone, userId: user?.id || null },
  });

  await notifyAdmin({
    title: '재입고 알림 신청',
    body: `${product.name} · ${phone}`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/restock-alerts`,
  });

  return NextResponse.json({ ok: true, alert });
}
