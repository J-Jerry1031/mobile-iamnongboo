import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { CheckCircle2, KeyRound, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const checks = [
  { key: 'AUTH_SECRET', label: '세션 서명 키', secret: true },
  { key: 'DATABASE_URL', label: 'Supabase DB 연결', secret: true },
  { key: 'DIRECT_URL', label: 'Supabase Direct URL', secret: true },
  { key: 'TOSS_SECRET_KEY', label: '토스 Secret Key', secret: true },
  { key: 'NEXT_PUBLIC_TOSS_CLIENT_KEY', label: '토스 Client Key', secret: false },
  { key: 'NEXT_PUBLIC_BASE_URL', label: '서비스 Base URL', secret: false },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', secret: false },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anon key', secret: false },
  { key: 'ADMIN_NOTIFY_WEBHOOK_URL', label: '관리자 알림 Webhook', secret: true },
  { key: 'NEXT_PUBLIC_BUSINESS_NAME', label: '사업자 상호', secret: false },
  { key: 'NEXT_PUBLIC_BUSINESS_OWNER', label: '대표자명', secret: false },
  { key: 'NEXT_PUBLIC_BUSINESS_REGISTRATION_NO', label: '사업자등록번호', secret: false },
  { key: 'NEXT_PUBLIC_BUSINESS_ADDRESS', label: '사업장 주소', secret: false },
  { key: 'NEXT_PUBLIC_BUSINESS_PHONE', label: '고객센터 연락처', secret: false },
];

function mask(value?: string) {
  if (!value) return '미설정';
  if (value.length <= 10) return `${value.slice(0, 2)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default async function AdminSystemPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/system&reason=protected');
  const missingRequired = checks.filter((item) => ['AUTH_SECRET', 'DATABASE_URL', 'DIRECT_URL', 'TOSS_SECRET_KEY', 'NEXT_PUBLIC_TOSS_CLIENT_KEY', 'NEXT_PUBLIC_BASE_URL'].includes(item.key) && !process.env[item.key]);
  const missingOptional = checks.filter((item) => !['AUTH_SECRET', 'DATABASE_URL', 'DIRECT_URL', 'TOSS_SECRET_KEY', 'NEXT_PUBLIC_TOSS_CLIENT_KEY', 'NEXT_PUBLIC_BASE_URL'].includes(item.key) && !process.env[item.key]);

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">SYSTEM</p>
        <h1 className="mt-2 text-2xl font-black">오픈 체크리스트</h1>
        <p className="mt-2 text-[13px] text-white/75">배포 환경변수와 보안 기본값을 확인해요.</p>
      </div>

      <section className={`mt-4 rounded-3xl p-5 ${missingRequired.length ? 'bg-red-50 text-red-700' : 'bg-[#e5f0dc] text-[#214b36]'}`}>
        <p className="font-black">{missingRequired.length ? '필수 설정이 남아 있어요' : '필수 설정이 준비됐어요'}</p>
        <p className="mt-2 text-sm font-bold leading-6">
          {missingRequired.length
            ? missingRequired.map((item) => item.key).join(', ')
            : missingOptional.length
              ? `선택 설정 ${missingOptional.length}개를 더 채우면 고객 신뢰 정보가 완성됩니다.`
              : '필수/선택 설정이 모두 채워졌습니다.'}
        </p>
      </section>

      <div className="mt-5 space-y-3">
        {checks.map((item) => {
          const value = process.env[item.key];
          const ok = Boolean(value);

          return (
            <div key={item.key} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${ok ? 'bg-[#e5f0dc] text-[#214b36]' : 'bg-red-50 text-red-600'}`}>
                {ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-[#1f2a24]">{item.label}</p>
                <p className="mt-1 truncate text-xs font-bold text-[#7a6b4d]">{item.key} · {item.secret ? mask(value) : value || '미설정'}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-5 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <KeyRound size={18} className="text-[#668f6b]" /> 보안 메모
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#5b5141]">
          <p>브라우저에는 `NEXT_PUBLIC_*` 값만 노출됩니다. `DATABASE_URL`, `DIRECT_URL`, `TOSS_SECRET_KEY`, `AUTH_SECRET`은 서버 환경변수에만 두세요.</p>
          <p>Supabase 테이블은 RLS를 켜고, 관리자 쓰기는 지금처럼 서버 API에서 권한 체크를 거치는 구조를 유지하는 것이 좋습니다.</p>
          <p>Vercel Production, Preview, Local 환경변수 값이 서로 맞는지 오픈 전 한 번 더 확인해주세요.</p>
          <p>`ADMIN_NOTIFY_WEBHOOK_URL`을 설정하면 새 주문과 새 문의가 들어올 때 관리자 알림을 받을 수 있습니다.</p>
        </div>
      </section>
    </div>
  );
}
