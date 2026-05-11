import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { notifyAdmin } from '@/lib/notify';
import { normalizePhone } from '@/lib/phone';
import { asRecord, safeCuid, safeText, safeTossOrderId } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';
import { calculateCouponDiscount, normalizeCouponCode } from '@/lib/coupons';

type IncomingCartItem = {
  id: string;
  quantity: number;
};

export async function POST(req: Request) {
  const limited = await rateLimit('order-create', 20, 60_000);
  if (limited) return limited;

  const user = await getCurrentUser();
  const body = asRecord(await req.json());
  const { items, buyerName, buyerPhone, address, deliveryMethod, tossOrderId, couponCode } = body as {
    items?: IncomingCartItem[];
    buyerName?: string;
    buyerPhone?: string;
    address?: string;
    deliveryMethod?: 'pickup' | 'delivery';
    tossOrderId?: string;
    couponCode?: string;
  };

  const safeBuyerName = safeText(buyerName, 50);
  const safeAddress = safeText(address, 500);
  const safeOrderId = safeTossOrderId(tossOrderId);
  if (!items?.length || items.length > 50) return NextResponse.json({ message: '장바구니에 담긴 상품을 확인해주세요.' }, { status: 400 });
  if (!safeBuyerName || !buyerPhone) return NextResponse.json({ message: '주문자 정보가 부족해요.' }, { status: 400 });
  const normalizedBuyerPhone = normalizePhone(buyerPhone);
  if (!/^01\d{8,9}$/.test(normalizedBuyerPhone)) return NextResponse.json({ message: '연락처를 정확히 입력해주세요.' }, { status: 400 });
  if (!['pickup', 'delivery'].includes(String(deliveryMethod))) return NextResponse.json({ message: '수령 방법을 선택해주세요.' }, { status: 400 });
  if (deliveryMethod === 'delivery' && !safeAddress) return NextResponse.json({ message: '배송지를 입력해주세요.' }, { status: 400 });
  if (!safeOrderId) return NextResponse.json({ message: '결제 주문번호가 필요해요.' }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { tossOrderId: safeOrderId } });
  if (existing) return NextResponse.json(existing);

  const productIds = [...new Set(items.map((item) => safeCuid(item.id)).filter(Boolean))];
  if (productIds.length !== items.length) {
    return NextResponse.json({ message: '상품 정보가 올바르지 않아요.' }, { status: 400 });
  }
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems: { product: (typeof products)[number]; quantity: number }[] = [];

  for (const item of items) {
    const productId = safeCuid(item.id);
    const product = productMap.get(productId);
    const quantity = Math.min(99, Math.max(1, Number(item.quantity || 1)));
    if (!product) return NextResponse.json({ message: '판매 중인 상품만 주문할 수 있어요.' }, { status: 400 });
    if (product.stock < quantity) return NextResponse.json({ message: `${product.name} 재고가 부족해요.` }, { status: 400 });
    orderItems.push({ product, quantity });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'delivery' && subtotal < 30000 ? 3000 : 0;
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  if (normalizedCouponCode && !user) {
    return NextResponse.json({ message: '쿠폰 사용은 로그인이 필요해요.' }, { status: 401 });
  }
  const coupon = normalizedCouponCode ? await prisma.coupon.findUnique({ where: { code: normalizedCouponCode } }) : null;
  const usedCoupon = coupon && user
    ? await prisma.couponRedemption.findFirst({
        where: { couponId: coupon.id, userId: user.id },
        select: { id: true },
      })
    : null;
  const discountAmount = coupon ? calculateCouponDiscount(coupon, subtotal, deliveryFee) : 0;
  if (normalizedCouponCode && (!coupon || usedCoupon || discountAmount <= 0)) {
    return NextResponse.json({ message: '사용할 수 없는 쿠폰입니다.' }, { status: 400 });
  }
  const totalAmount = subtotal + deliveryFee - discountAmount;
  const orderNo = `IMF-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      tossOrderId: safeOrderId,
      userId: user?.id || null,
      buyerName: safeBuyerName,
      buyerPhone: normalizedBuyerPhone,
      address: deliveryMethod === 'pickup' ? `매장 픽업${safeAddress ? ` / ${safeAddress}` : ''}` : safeAddress,
      deliveryMethod,
      discountAmount,
      couponCode: coupon?.code || null,
      totalAmount,
      status: 'READY',
      items: { create: orderItems.map(({ product, quantity }) => ({ productId: product.id, name: product.name, price: product.price, quantity })) },
    },
    include: { items: true },
  });
  await notifyAdmin({
    title: '새 주문이 접수됐어요',
    body: `${order.orderNo} · ${safeBuyerName} · ${totalAmount.toLocaleString('ko-KR')}원`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/orders`,
  });

  return NextResponse.json(order);
}
