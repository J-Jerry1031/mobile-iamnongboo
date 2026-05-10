export default function BusinessPage() {
  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || '아이엠농부';
  const owner = process.env.NEXT_PUBLIC_BUSINESS_OWNER || '대표자명을 입력해주세요';
  const registrationNo = process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION_NO || '사업자등록번호를 입력해주세요';
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '사업장 주소를 입력해주세요';
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '연락처를 입력해주세요';

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">BUSINESS</p>
        <h1 className="mt-2 text-2xl font-black">사업자 정보</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">고객 신뢰를 위한 판매자 정보를 안내합니다.</p>
      </div>
      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="space-y-4 text-sm">
          {[
            ['상호', businessName],
            ['대표자', owner],
            ['사업자등록번호', registrationNo],
            ['주소', address],
            ['고객센터', phone],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-[#f1ead9] pb-3 last:border-b-0 last:pb-0">
              <span className="shrink-0 font-bold text-[#7a6b4d]">{label}</span>
              <span className="text-right font-black text-[#1f2a24]">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
