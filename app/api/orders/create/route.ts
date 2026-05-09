import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

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
  if (deliveryMethod === 'delivery' && !address) return NextResponse.json({ message: '배송지를 입력해주세요.' }, { status: 400 });

  const productIds = items.map((item) => item.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = items.map((item) => {
    const product = productMap.get(item.id);
    const quantity = Math.max(1, Number(item.quantity || 1));
    if (!product) throw new Error('판매 중인 상품만 주문할 수 있어요.');
    if (product.stock < quantity) throw new Error(`${product.name} 재고가 부족해요.`);
    return { product, quantity };
  });

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
      buyerPhone,
      address: deliveryMethod === 'pickup' ? `매장 픽업${address ? ` / ${address}` : ''}` : address,
      totalAmount,
      status: 'READY',
      items: { create: orderItems.map(({ product, quantity }) => ({ productId: product.id, name: product.name, price: product.price, quantity })) },
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}
