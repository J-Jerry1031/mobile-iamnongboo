import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { ChevronRight, MessageCircle, PackageCheck, ShoppingBag, UsersRound } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin&reason=protected');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayOrders, requestOrders, openInquiries, soldOutProducts, userCount] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ['CANCEL_REQUESTED', 'RETURN_REQUESTED'] } } }),
    prisma.inquiry.count({ where: { status: 'OPEN' } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.user.count(),
  ]);

  const cards = [
    { label: '오늘 주문', value: todayOrders, href: '/admin/orders', icon: PackageCheck },
    { label: '취소/반품 요청', value: requestOrders, href: '/admin/orders', icon: PackageCheck },
    { label: '답변대기 문의', value: openInquiries, href: '/admin/inquiries', icon: MessageCircle },
    { label: '품절 상품', value: soldOutProducts, href: '/admin/products', icon: ShoppingBag },
    { label: '회원', value: userCount, href: '/admin/members', icon: UsersRound },
  ];

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADMIN</p>
        <h1 className="mt-2 text-2xl font-black">운영 대시보드</h1>
        <p className="mt-2 text-[13px] text-white/75">주문, 문의, 상품, 회원 상태를 한눈에 확인해요.</p>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {cards.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-3xl bg-white p-4 shadow-sm active:scale-[.99]">
            <Icon className="text-[#668f6b]" size={22} />
            <p className="mt-3 text-2xl font-black text-[#214b36]">{value}</p>
            <p className="mt-1 text-xs font-bold text-[#7a6b4d]">{label}</p>
          </Link>
        ))}
      </section>

      <div className="mt-5 grid gap-3">
        {[
          ['주문관리', '/admin/orders'],
          ['회원관리', '/admin/members'],
          ['상품관리', '/admin/products'],
          ['문의 답변', '/admin/inquiries'],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="flex items-center justify-between rounded-2xl bg-white p-4 font-black text-[#1f2a24]">
            {label}
            <ChevronRight size={18} className="text-[#7a6b4d]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
