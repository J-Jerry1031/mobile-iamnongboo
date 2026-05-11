import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ChevronLeft, TicketPercent } from 'lucide-react';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { normalizeCouponCode } from '@/lib/coupons';
import { safeInt, safeText } from '@/lib/security';
import { won } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function createCoupon(formData: FormData) {
  'use server';
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/coupons&reason=protected');

  const code = normalizeCouponCode(formData.get('code'));
  const name = safeText(formData.get('name'), 80);
  const discountType = formData.get('discountType') === 'PERCENT' ? 'PERCENT' : 'FIXED';
  const discountValue = safeInt(formData.get('discountValue'), 0, 1, 1_000_000);
  const minOrderAmount = safeInt(formData.get('minOrderAmount'), 0, 0, 10_000_000);
  const maxDiscount = discountType === 'PERCENT' ? safeInt(formData.get('maxDiscount'), 0, 0, 1_000_000) : 0;
  const usageLimit = safeInt(formData.get('usageLimit'), 0, 0, 100_000);
  if (!code || !name || !discountValue) redirect('/admin/coupons');

  const coupon = await prisma.coupon.upsert({
    where: { code },
    update: {
      name,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      isActive: true,
    },
    create: {
      code,
      name,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      isActive: true,
    },
  });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: 'COUPON_UPSERT',
      targetType: 'COUPON',
      targetId: coupon.id,
      summary: `${coupon.code} 쿠폰 저장`,
    },
  });
  revalidatePath('/admin/coupons');
}

export default async function AdminCouponsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/coupons&reason=protected');

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, include: { redemptions: true } });

  return (
    <div className="px-5 pt-5">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={17} /> 관리자
      </Link>
      <div className="mt-4 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">COUPONS</p>
        <h1 className="mt-2 text-2xl font-black">쿠폰 관리</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">첫 구매, 무료배송, 시즌 할인 쿠폰을 운영해요.</p>
      </div>

      <form action={createCoupon} className="mt-5 space-y-3 rounded-3xl bg-white p-5">
        <input name="code" placeholder="쿠폰 코드 예: WELCOME3000" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none" />
        <input name="name" placeholder="쿠폰명 예: 첫 구매 3천원 할인" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <select name="discountType" className="rounded-2xl bg-[#fffaf0] p-4 outline-none">
            <option value="FIXED">정액 할인</option>
            <option value="PERCENT">정률 할인</option>
          </select>
          <input name="discountValue" type="number" placeholder="할인값" className="rounded-2xl bg-[#fffaf0] p-4 outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input name="minOrderAmount" type="number" placeholder="최소주문" className="rounded-2xl bg-[#fffaf0] p-3 text-sm outline-none" />
          <input name="maxDiscount" type="number" placeholder="최대할인" className="rounded-2xl bg-[#fffaf0] p-3 text-sm outline-none" />
          <input name="usageLimit" type="number" placeholder="사용제한" className="rounded-2xl bg-[#fffaf0] p-3 text-sm outline-none" />
        </div>
        <button className="w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">쿠폰 저장</button>
      </form>

      <div className="mt-5 space-y-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 font-black text-[#1f2a24]">
              <TicketPercent size={18} className="text-[#668f6b]" /> {coupon.code}
            </p>
            <p className="mt-1 text-sm font-bold text-[#7a6b4d]">{coupon.name}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <span className="rounded-2xl bg-[#fffaf0] p-3">{coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : won(coupon.discountValue)}</span>
              <span className="rounded-2xl bg-[#fffaf0] p-3">최소 {won(coupon.minOrderAmount)}</span>
              <span className="rounded-2xl bg-[#fffaf0] p-3">사용 {coupon.redemptions.length}건</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
