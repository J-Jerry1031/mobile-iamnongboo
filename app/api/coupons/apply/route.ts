import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCouponDiscount, normalizeCouponCode } from '@/lib/coupons';
import { asRecord, safeCuid } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

type IncomingCartItem = {
  id: string;
  quantity: number;
};

export async function POST(req: Request) {
  const limited = await rateLimit('coupon-apply', 30, 60_000);
  if (limited) return limited;

  const body = asRecord(await req.json());
  const code = normalizeCouponCode(body.code);
  const items = Array.isArray(body.items) ? body.items as IncomingCartItem[] : [];
  if (!code) return NextResponse.json({ message: '쿠폰 코드를 입력해주세요.' }, { status: 400 });
  if (!items.length) return NextResponse.json({ message: '장바구니에 상품을 담아주세요.' }, { status: 400 });

  const productIds = [...new Set(items.map((item) => safeCuid(item.id)).filter(Boolean))];
  if (productIds.length !== items.length) return NextResponse.json({ message: '상품 정보가 올바르지 않아요.' }, { status: 400 });

  const [coupon, products] = await Promise.all([
    prisma.coupon.findUnique({ where: { code } }),
    prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } }),
  ]);
  if (!coupon) return NextResponse.json({ message: '사용할 수 없는 쿠폰입니다.' }, { status: 404 });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.id);
    const quantity = Math.min(99, Math.max(1, Number(item.quantity || 1)));
    return sum + (product ? product.price * quantity : 0);
  }, 0);
  const deliveryMethod = body.deliveryMethod === 'delivery' ? 'delivery' : 'pickup';
  const deliveryFee = deliveryMethod === 'delivery' && subtotal > 0 && subtotal < 30000 ? 3000 : 0;
  const discountAmount = calculateCouponDiscount(coupon, subtotal, deliveryFee);
  if (discountAmount <= 0) return NextResponse.json({ message: '주문 조건에 맞지 않는 쿠폰입니다.' }, { status: 400 });

  return NextResponse.json({
    coupon: {
      code: coupon.code,
      name: coupon.name,
      discountAmount,
    },
  });
}
