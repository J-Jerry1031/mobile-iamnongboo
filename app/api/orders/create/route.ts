import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const { items, buyerName, buyerPhone, address, tossOrderId } = body;

  if (!items?.length) return NextResponse.json({ message: '장바구니가 비어 있어요.' }, { status: 400 });
  if (!buyerName || !buyerPhone) return NextResponse.json({ message: '주문자 정보가 부족해요.' }, { status: 400 });

  const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);
  const orderNo = `IMF-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      tossOrderId,
      userId: user?.id || null,
      buyerName,
      buyerPhone,
      address,
      totalAmount,
      status: 'READY',
      items: { create: items.map((item: any) => ({ productId: item.id, name: item.name, price: Number(item.price), quantity: Number(item.quantity) })) },
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}
