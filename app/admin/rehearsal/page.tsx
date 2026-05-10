import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { CheckCircle2, CreditCard, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const rehearsalItems = [
  ['상품 선택', '홈 또는 상품목록에서 실제 판매 상품을 장바구니에 담습니다.', '/products/market'],
  ['장바구니 확인', '수량, 무료배송, 총 결제금액이 맞는지 확인합니다.', '/cart'],
  ['결제 진행', '토스 테스트 결제로 승인/취소/실패 케이스를 각각 확인합니다.', '/checkout'],
  ['주문 완료', '주문완료 화면에서 주문번호와 상품 요약이 보이는지 확인합니다.', '/orders'],
  ['관리자 처리', '관리자 주문관리에서 상품준비중, 픽업준비, 완료 상태로 변경합니다.', '/admin/orders'],
  ['감사 로그', '상태 변경 기록이 작업 로그에 남는지 확인합니다.', '/admin/audit'],
];

export default async function AdminRehearsalPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/rehearsal&reason=protected');

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">REHEARSAL</p>
        <h1 className="mt-2 text-2xl font-black">결제 리허설</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">오픈 전 실제 고객 플로우를 순서대로 점검해요.</p>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <CreditCard size={19} className="text-[#668f6b]" /> 테스트 순서
        </h2>
        <div className="mt-4 space-y-3">
          {rehearsalItems.map(([title, body, href], index) => (
            <Link key={title} href={href} className="flex gap-3 rounded-2xl bg-[#fffaf0] p-4 active:scale-[.99]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#214b36] text-xs font-black text-white">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-[#1f2a24]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#7a6b4d]">{body}</span>
              </span>
              <ExternalLink size={16} className="mt-1 text-[#7a6b4d]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <CheckCircle2 size={19} className="text-[#668f6b]" /> 완료 기준
        </h2>
        <div className="mt-4 space-y-2 text-sm leading-6 text-[#5b5141]">
          <p>결제 성공 시 주문 상태가 결제완료로 바뀌고 재고가 차감되어야 합니다.</p>
          <p>결제 실패/취소 시 장바구니가 유지되어야 합니다.</p>
          <p>관리자 상태 변경 시 `/admin/audit`에 기록이 남아야 합니다.</p>
        </div>
      </section>
    </div>
  );
}
