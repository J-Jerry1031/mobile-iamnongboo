import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bell, ChevronLeft, Phone } from 'lucide-react';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { formatPhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export default async function AdminRestockAlertsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/restock-alerts&reason=protected');

  const alerts = await prisma.restockAlert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { product: true, user: true },
  });

  return (
    <div className="px-5 pt-5">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={17} /> 관리자
      </Link>
      <div className="mt-4 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">RESTOCK</p>
        <h1 className="mt-2 text-2xl font-black">재입고 알림</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">품절 상품을 기다리는 고객을 확인해요.</p>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 font-black text-[#1f2a24]">
              <Bell size={18} className="text-[#668f6b]" /> {alert.product.name}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#7a6b4d]">
              <Phone size={15} /> {formatPhone(alert.phone)} · {alert.user?.name || '비회원'}
            </p>
            <p className="mt-2 text-xs font-bold text-[#7a6b4d]">{alert.createdAt.toLocaleString('ko-KR')} · {alert.status}</p>
          </div>
        ))}
        {!alerts.length && <p className="rounded-3xl bg-white p-6 text-center text-sm font-bold text-[#7a6b4d]">재입고 알림 신청이 아직 없어요.</p>}
      </div>
    </div>
  );
}
