import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, CheckCircle2, TicketPercent } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';

export const dynamic = 'force-dynamic';

function couponBenefit(coupon: { discountType: string; discountValue: number; maxDiscount: number | null }) {
  if (coupon.discountType === 'PERCENT') {
    return `${coupon.discountValue}% 할인${coupon.maxDiscount ? ` · 최대 ${won(coupon.maxDiscount)}` : ''}`;
  }
  return `${won(coupon.discountValue)} 할인`;
}

export default async function MyCouponsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/mypage/coupons&reason=protected');

  const now = new Date();
  const [coupons, usedRedemptions] = await Promise.all([
    prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.couponRedemption.findMany({
      where: { userId: user.id },
      select: { couponId: true, createdAt: true, amount: true, coupon: { select: { code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const usedCouponIds = new Set(usedRedemptions.map((item) => item.couponId));
  const usableCoupons = coupons.filter((coupon) => !usedCouponIds.has(coupon.id));

  return (
    <div className="px-5 pb-8 pt-5">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={17} /> 마이페이지
      </Link>

      <div className="mt-4 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">COUPON</p>
        <h1 className="mt-2 text-2xl font-black">쿠폰함</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          결제 단계에서 사용할 수 있는 쿠폰과 사용 이력을 확인해요.
        </p>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
            <TicketPercent size={19} className="text-[#668f6b]" /> 사용 가능
          </h2>
          <span className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{usableCoupons.length}장</span>
        </div>
        <div className="mt-4 space-y-3">
          {usableCoupons.map((coupon) => (
            <div key={coupon.id} className="rounded-2xl bg-[#fffaf0] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#1f2a24]">{coupon.name}</p>
                  <p className="mt-1 text-xs font-bold text-[#7a6b4d]">{coupon.code}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#214b36]">
                  {couponBenefit(coupon)}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-[#7a6b4d]">
                최소 {won(coupon.minOrderAmount)} 이상 주문
                {coupon.endsAt ? ` · ${coupon.endsAt.toLocaleDateString('ko-KR')}까지` : ''}
              </p>
            </div>
          ))}
          {!usableCoupons.length && (
            <p className="rounded-2xl bg-[#fffaf0] p-5 text-center text-sm font-bold text-[#7a6b4d]">
              지금 사용할 수 있는 쿠폰이 없어요.
            </p>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <CheckCircle2 size={19} className="text-[#668f6b]" /> 사용 이력
        </h2>
        <div className="mt-4 space-y-3">
          {usedRedemptions.map((item) => (
            <div key={`${item.couponId}-${item.createdAt.toISOString()}`} className="rounded-2xl bg-white p-4 text-sm">
              <p className="font-black text-[#1f2a24]">{item.coupon.name}</p>
              <p className="mt-1 text-xs font-bold text-[#7a6b4d]">{item.coupon.code} · {item.createdAt.toLocaleDateString('ko-KR')}</p>
              <p className="mt-2 font-black text-[#214b36]">-{won(item.amount)}</p>
            </div>
          ))}
          {!usedRedemptions.length && (
            <p className="rounded-2xl bg-white p-5 text-center text-sm font-bold text-[#7a6b4d]">
              아직 사용한 쿠폰이 없어요.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
