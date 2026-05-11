import type { Coupon } from '@prisma/client';

export function normalizeCouponCode(value: unknown) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
}

export function calculateCouponDiscount(coupon: Coupon, subtotal: number, deliveryFee = 0) {
  const orderAmount = subtotal + deliveryFee;
  if (!coupon.isActive) return 0;
  if (coupon.minOrderAmount > orderAmount) return 0;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return 0;

  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) return 0;
  if (coupon.endsAt && coupon.endsAt.getTime() < now) return 0;

  const rawDiscount = coupon.discountType === 'PERCENT'
    ? Math.floor(orderAmount * (coupon.discountValue / 100))
    : coupon.discountValue;
  const cappedDiscount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
  return Math.max(0, Math.min(cappedDiscount, orderAmount));
}
