import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { Bell, ChevronRight, ClipboardCheck, Clock3, Eye, MessageCircle, PackageCheck, ShoppingBag, Star, TicketPercent, Truck, UsersRound } from 'lucide-react';
import { orderStatusLabel } from '@/lib/order-status';
import { won } from '@/lib/format';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin&reason=protected');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayOrders, requestOrders, openInquiries, soldOutProducts, lowStockProducts, preparingOrders, shippingReadyOrders, userCount, privacyLogCount, couponCount, restockCount, reviewCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ['CANCEL_REQUESTED', 'RETURN_REQUESTED'] } } }),
    prisma.inquiry.count({ where: { status: 'OPEN' } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 5 }, isActive: true } }),
    prisma.order.count({ where: { status: { in: ['PAID', 'PREPARING'] } } }),
    prisma.order.count({ where: { status: { in: ['READY_FOR_PICKUP', 'SHIPPING'] } } }),
    prisma.user.count(),
    prisma.privacyAccessLog.count(),
    prisma.coupon.count(),
    prisma.restockAlert.count({ where: { status: 'WAITING' } }),
    prisma.review.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 4, include: { items: true } }),
  ]);
  const auditCount = await prisma.adminAuditLog.count();

  const cards = [
    { label: '오늘 주문', value: todayOrders, href: '/admin/orders', icon: PackageCheck },
    { label: '취소/반품 요청', value: requestOrders, href: '/admin/orders', icon: PackageCheck },
    { label: '답변대기 문의', value: openInquiries, href: '/admin/inquiries', icon: MessageCircle },
    { label: '품절 상품', value: soldOutProducts, href: '/admin/products', icon: ShoppingBag },
    { label: '재고 5개 이하', value: lowStockProducts, href: '/admin/catalog-quality', icon: Bell },
    { label: '회원', value: userCount, href: '/admin/members', icon: UsersRound },
    { label: '쿠폰', value: couponCount, href: '/admin/coupons', icon: TicketPercent },
    { label: '재입고 알림', value: restockCount, href: '/admin/restock-alerts', icon: Bell },
    { label: '상품 후기', value: reviewCount, href: '/admin/reviews', icon: Star },
    { label: '작업 로그', value: auditCount, href: '/admin/audit', icon: ClipboardCheck },
    { label: '개인정보 조회 로그', value: privacyLogCount, href: '/admin/privacy-logs', icon: Eye },
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

      <section className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: '처리 대기', value: preparingOrders, href: '/admin/orders', icon: Clock3 },
          { label: '배송/픽업중', value: shippingReadyOrders, href: '/admin/orders', icon: Truck },
          { label: '미답변 문의', value: openInquiries, href: '/admin/inquiries', icon: MessageCircle },
        ].map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-2xl bg-[#fcfbf6] p-3 text-center ring-1 ring-[#eadfce]">
            <Icon className="mx-auto text-[#668f6b]" size={18} />
            <p className="mt-2 text-lg font-black text-[#214b36]">{value}</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">{label}</p>
          </Link>
        ))}
      </section>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-[#1f2a24]">최근 주문</h2>
          <Link href="/admin/orders" className="text-xs font-black text-[#214b36]">전체보기</Link>
        </div>
        <div className="mt-4 space-y-2">
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf0] p-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#1f2a24]">{order.items[0]?.name || order.orderNo}</span>
                <span className="mt-1 block text-xs font-bold text-[#7a6b4d]">{order.orderNo} · {orderStatusLabel[order.status]}</span>
              </span>
              <span className="shrink-0 text-sm font-black text-[#214b36]">{won(order.totalAmount)}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-3">
        {[
          ['주문관리', '/admin/orders'],
          ['회원관리', '/admin/members'],
          ['상품관리', '/admin/products'],
          ['쿠폰 관리', '/admin/coupons'],
          ['재입고 알림', '/admin/restock-alerts'],
          ['후기 관리', '/admin/reviews'],
          ['상품 품질 점검', '/admin/catalog-quality'],
          ['문의 답변', '/admin/inquiries'],
          ['결제 리허설', '/admin/rehearsal'],
          ['작업 로그', '/admin/audit'],
          ['개인정보 조회 로그', '/admin/privacy-logs'],
          ['오픈 체크리스트', '/admin/system'],
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
