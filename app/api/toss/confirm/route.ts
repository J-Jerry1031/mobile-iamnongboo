import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { paymentKey, orderId, amount } = await req.json();

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ message: '결제 승인 정보가 부족해요.' }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encryptedSecretKey = Buffer.from(secretKey + ':').toString('base64');

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: `Basic ${encryptedSecretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();

  if (response.ok) {
    const order = await prisma.order.findUnique({ where: { tossOrderId: orderId }, include: { items: true } });
    if (order && order.status !== 'PAID') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        await tx.order.update({ where: { id: order.id }, data: { status: 'PAID', paymentKey } });
      });
    }
  }

  return NextResponse.json(data, { status: response.status });
}
