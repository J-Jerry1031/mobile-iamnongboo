import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { Clock3, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/audit&reason=protected');

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 80,
    include: { admin: true },
  });

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">AUDIT</p>
        <h1 className="mt-2 text-2xl font-black">관리자 작업 로그</h1>
        <p className="mt-2 text-[13px] text-white/75">주문, 상품, 문의 변경 이력을 확인해요.</p>
      </div>

      <div className="mt-5 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
                <ShieldCheck size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fcfbf6] px-2 py-1 text-[10px] font-black text-[#214b36]">{log.action}</span>
                  <span className="rounded-full bg-[#fcfbf6] px-2 py-1 text-[10px] font-black text-[#7a6b4d]">{log.targetType}</span>
                </div>
                <p className="mt-2 font-black text-[#1f2a24]">{log.summary}</p>
                <p className="mt-1 text-xs text-[#7a6b4d]">{log.admin?.name || '관리자'}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-[#7a6b4d]">
                  <Clock3 size={13} /> {log.createdAt.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        ))}
        {!logs.length && <p className="rounded-3xl bg-white p-5 text-sm text-[#7a6b4d]">아직 기록된 관리자 작업이 없어요.</p>}
      </div>
    </div>
  );
}
