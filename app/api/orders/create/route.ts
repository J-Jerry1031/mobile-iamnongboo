import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { notifyAdmin } from '@/lib/notify';
import { normalizePhone } from '@/lib/phone';

type IncomingCartItem = {
  id: string;
  quantity: number;
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const { items, buyerName, buyerPhone, address, deliveryMethod, tossOrderId } = body as {
    items?: IncomingCartItem[];
    buyerName?: string;
    buyerPhone?: string;
    address?: string;
    deliveryMethod?: 'pickup' | 'delivery';
    tossOrderId?: string;
  };

  if (!items?.length) return NextResponse.json({ message: '장바구니가 비어 있어요.' }, { status: 400 });
  if (!buyerName || !buyerPhone) return NextResponse.json({ message: '주문자 정보가 부족해요.' }, { status: 400 });
  const normalizedBuyerPhone = normalizePhone(buyerPhone);
  if (!/^01\d{8,9}$/.test(normalizedBuyerPhone)) return NextResponse.json({ message: '연락처를 정확히 입력해주세요.' }, { status: 400 });
  if (!['pickup', 'delivery'].includes(String(deliveryMethod))) return NextResponse.json({ message: '수령 방법을 선택해주세요.' }, { status: 400 });
  if (deliveryMethod === 'delivery' && !address) return NextResponse.json({ message: '배송지를 입력해주세요.' }, { status: 400 });
  if (!tossOrderId) return NextResponse.json({ message: '결제 주문번호가 필요해요.' }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { tossOrderId } });
  if (existing) return NextResponse.json(existing);

  const productIds = items.map((item) => item.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems: { product: (typeof products)[number]; quantity: number }[] = [];

  for (const item of items) {
    const product = productMap.get(item.id);
    const quantity = Math.max(1, Number(item.quantity || 1));
    if (!product) return NextResponse.json({ message: '판매 중인 상품만 주문할 수 있어요.' }, { status: 400 });
    if (product.stock < quantity) return NextResponse.json({ message: `${product.name} 재고가 부족해요.` }, { status: 400 });
    orderItems.push({ product, quantity });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'delivery' && subtotal < 30000 ? 3000 : 0;
  const totalAmount = subtotal + deliveryFee;
  const orderNo = `IMF-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      tossOrderId,
      userId: user?.id || null,
      buyerName,
      buyerPhone: normalizedBuyerPhone,
      address: deliveryMethod === 'pickup' ? `매장 픽업${address ? ` / ${address}` : ''}` : address,
      totalAmount,
      status: 'READY',
      items: { create: orderItems.map(({ product, quantity }) => ({ productId: product.id, name: product.name, price: product.price, quantity })) },
    },
    include: { items: true },
  });
  await notifyAdmin({
    title: '새 주문이 접수됐어요',
    body: `${order.orderNo} · ${buyerName} · ${totalAmount.toLocaleString('ko-KR')}원`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/orders`,
  });

  return NextResponse.json(order);
}
