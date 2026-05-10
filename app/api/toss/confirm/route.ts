import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { paymentKey, orderId, amount } = await req.json();

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ message: '결제 승인 정보가 부족해요.' }, { status: 400 });
  }
  if (!process.env.TOSS_SECRET_KEY) {
    return NextResponse.json({ message: '결제 시크릿 키가 설정되지 않았어요.' }, { status: 500 });
  }

  const order = await prisma.order.findUnique({ where: { tossOrderId: orderId }, include: { items: true } });
  if (!order) {
    return NextResponse.json({ message: '주문 정보를 찾을 수 없어요.' }, { status: 404 });
  }
  if (order.totalAmount !== Number(amount)) {
    return NextResponse.json({ message: '결제 금액이 주문 금액과 일치하지 않아요.' }, { status: 400 });
  }
  if (order.status === 'PAID') {
    return NextResponse.json({ status: 'DONE', message: '이미 결제 완료된 주문입니다.' });
  }

  const products = await prisma.product.findMany({ where: { id: { in: order.items.map((item) => item.productId) } } });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const insufficient = order.items.find((item) => (productMap.get(item.productId)?.stock ?? 0) < item.quantity);
  if (insufficient) {
    return NextResponse.json({ message: `${insufficient.name} 재고가 부족해 결제를 승인할 수 없어요.` }, { status: 409 });
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

  return NextResponse.json(data, { status: response.status });
}
