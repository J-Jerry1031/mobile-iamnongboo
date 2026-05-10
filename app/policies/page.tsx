import Link from 'next/link';
import { ChevronRight, FileText, ShieldCheck } from 'lucide-react';

const items = [
  ['이용약관', '/policies/terms'],
  ['개인정보처리방침', '/policies/privacy'],
  ['교환/환불 안내', '/policies/refund'],
  ['사업자 정보', '/policies/business'],
];

export default function PoliciesPage() {
  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">POLICY</p>
        <h1 className="mt-2 text-2xl font-black">고객 안내</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">구매 전 확인할 약관과 운영 정보를 모았어요.</p>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <ShieldCheck size={19} className="text-[#668f6b]" /> 아이엠농부 안내
        </h2>
        <div className="mt-4 space-y-3">
          {items.map(([label, href]) => (
            <Link key={href} href={href} className="flex items-center justify-between rounded-2xl bg-[#fffaf0] p-4 font-black text-[#214b36]">
              <span className="flex items-center gap-2"><FileText size={17} /> {label}</span>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
