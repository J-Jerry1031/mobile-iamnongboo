import Link from 'next/link';

export function MobileFooter() {
  return (
    <footer className="px-5 pb-8 pt-8 text-[13px] leading-6 text-[#7a6b4d]">
      <div className="rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
        <p className="text-sm font-black text-[#214b36]">아이엠농부</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-black">
          <Link href="/policies/terms">이용약관</Link>
          <Link href="/policies/privacy">개인정보처리방침</Link>
          <Link href="/policies/refund">교환/환불</Link>
          <Link href="/policies/business">사업자 정보</Link>
        </div>
      </div>
    </footer>
  );
}
