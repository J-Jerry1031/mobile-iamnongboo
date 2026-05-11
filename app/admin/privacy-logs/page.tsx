import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, Eye, MonitorSmartphone, UserRound } from 'lucide-react';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPrivacyLogsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/privacy-logs&reason=protected');

  const logs = await prisma.privacyAccessLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { admin: true },
  });

  return (
    <div className="px-5 pt-5">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={17} /> 관리자
      </Link>
      <div className="mt-4 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">PRIVACY ACCESS</p>
        <h1 className="mt-2 text-2xl font-black">개인정보 조회 로그</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          관리자 화면에서 회원/주문 개인정보를 조회한 기록을 확인해요.
        </p>
      </div>

      <section className="mt-4 rounded-3xl bg-[#e5f0dc] p-5 text-[#214b36]">
        <p className="flex items-center gap-2 font-black">
          <Eye size={18} /> 최근 {logs.length}건
        </p>
        <p className="mt-2 text-xs font-bold leading-5">
          이상한 시간대나 알 수 없는 접속 위치에서 개인정보 조회가 반복되면 즉시 비밀번호와 관리자 권한을 점검하세요.
        </p>
      </section>

      <div className="mt-5 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-[#1f2a24]">{log.summary}</p>
                <p className="mt-1 text-xs font-bold text-[#7a6b4d]">
                  {log.action} · {log.targetType}{log.targetId ? ` · ${log.targetId}` : ''}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#fcfbf6] px-3 py-1 text-[11px] font-black text-[#214b36]">
                {log.createdAt.toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="mt-3 grid gap-2 rounded-2xl bg-[#fffaf0] p-3 text-xs font-bold leading-5 text-[#7a6b4d]">
              <p className="flex items-center gap-2">
                <UserRound size={14} className="text-[#668f6b]" />
                {log.admin?.name || '알 수 없는 관리자'}
              </p>
              <p className="flex items-center gap-2">
                <MonitorSmartphone size={14} className="text-[#668f6b]" />
                IP {log.ip || '미기록'} · {log.createdAt.toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        ))}
        {!logs.length && (
          <p className="rounded-3xl bg-white p-6 text-center text-sm font-bold text-[#7a6b4d]">
            아직 개인정보 조회 로그가 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
