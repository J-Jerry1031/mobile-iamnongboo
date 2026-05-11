import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { asRecord, safeCuid, safeText, safeUrl } from '@/lib/security';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const body = asRecord(await req.json());
  const orderId = safeCuid(body.orderId);
  const carrier = safeText(body.carrier, 30);
  const trackingNumber = safeText(body.trackingNumber, 50);
  const trackingUrl = safeUrl(body.trackingUrl, '');
  if (!orderId) return NextResponse.json({ message: '주문 ID가 필요해요.' }, { status: 400 });
  if (!carrier || !trackingNumber) return NextResponse.json({ message: '택배사와 송장번호를 입력해주세요.' }, { status: 400 });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      carrier,
      trackingNumber,
      trackingUrl: trackingUrl || null,
      shippedAt: new Date(),
      status: 'SHIPPING',
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: 'ORDER_SHIPMENT_UPDATE',
      targetType: 'ORDER',
      targetId: order.id,
      summary: `${order.orderNo} 송장 ${carrier} ${trackingNumber} 등록`,
    },
  });

  return NextResponse.json(order);
}
