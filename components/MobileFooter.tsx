import Link from 'next/link';

export function MobileFooter() {
  return (
    <footer className="px-5 pb-6 pt-4 text-[11px] leading-5 text-[#7a6b4d]">
      <div className="rounded-3xl bg-[#fcfbf6] p-4 ring-1 ring-[#eadfce]">
        <p className="font-black text-[#214b36]">아이엠농부</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-bold">
          <Link href="/policies/terms">이용약관</Link>
          <Link href="/policies/privacy">개인정보처리방침</Link>
          <Link href="/policies/refund">교환/환불</Link>
          <Link href="/policies/business">사업자 정보</Link>
        </div>
        <p className="mt-3">신선식품은 상품 특성상 수령 당일 확인이 필요합니다.</p>
      </div>
    </footer>
  );
}
