import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { calculateCouponDiscount } from '@/lib/coupons';
import { asRecord, safeCuid } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

type IncomingCartItem = {
  id: string;
  quantity: number;
};

export async function POST(req: Request) {
  const limited = await rateLimit('coupon-available', 30, 60_000);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const body = asRecord(await req.json());
  const items = Array.isArray(body.items) ? body.items as IncomingCartItem[] : [];
  if (!items.length) return NextResponse.json({ coupons: [] });

  const productIds = [...new Set(items.map((item) => safeCuid(item.id)).filter(Boolean))];
  if (productIds.length !== items.length) return NextResponse.json({ message: '상품 정보가 올바르지 않아요.' }, { status: 400 });

  const [coupons, products, usedRedemptions] = await Promise.all([
    prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } }),
    prisma.couponRedemption.findMany({
      where: { userId: user.id },
      select: { couponId: true },
    }),
  ]);

  const usedCouponIds = new Set(usedRedemptions.map((item) => item.couponId));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.id);
    const quantity = Math.min(99, Math.max(1, Number(item.quantity || 1)));
    return sum + (product ? product.price * quantity : 0);
  }, 0);
  const deliveryMethod = body.deliveryMethod === 'delivery' ? 'delivery' : 'pickup';
  const deliveryFee = deliveryMethod === 'delivery' && subtotal > 0 && subtotal < 30000 ? 3000 : 0;

  return NextResponse.json({
    coupons: coupons.map((coupon) => {
      const discountAmount = usedCouponIds.has(coupon.id) ? 0 : calculateCouponDiscount(coupon, subtotal, deliveryFee);
      const unavailableReason = usedCouponIds.has(coupon.id)
        ? '이미 사용한 쿠폰'
        : discountAmount <= 0
          ? coupon.minOrderAmount > subtotal + deliveryFee
            ? `최소 ${coupon.minOrderAmount.toLocaleString('ko-KR')}원 이상`
            : '사용 조건 미충족'
          : '';

      return {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        discountAmount,
        unavailableReason,
      };
    }),
  });
}
