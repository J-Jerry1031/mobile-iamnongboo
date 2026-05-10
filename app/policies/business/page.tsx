export default function BusinessPage() {
  const rows = [
    ['상호', process.env.NEXT_PUBLIC_BUSINESS_NAME || '아이엠농부'],
    ['대표자', process.env.NEXT_PUBLIC_BUSINESS_OWNER],
    ['사업자등록번호', process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION_NO],
    ['주소', process.env.NEXT_PUBLIC_BUSINESS_ADDRESS],
    ['고객센터', process.env.NEXT_PUBLIC_BUSINESS_PHONE],
  ] as const;
  const missing = rows.filter(([, value]) => !value).map(([label]) => label);

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">BUSINESS</p>
        <h1 className="mt-2 text-2xl font-black">사업자 정보</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">고객 신뢰를 위한 판매자 정보를 안내합니다.</p>
      </div>
      {missing.length > 0 && (
        <p className="mt-4 rounded-2xl bg-[#fff4bf] p-4 text-sm font-bold leading-6 text-[#5b5141]">
          관리자 확인 필요: {missing.join(', ')} 정보가 아직 설정되지 않았습니다.
        </p>
      )}
      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="space-y-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-[#f1ead9] pb-3 last:border-b-0 last:pb-0">
              <span className="shrink-0 font-bold text-[#7a6b4d]">{label}</span>
              <span className={`text-right font-black ${value ? 'text-[#1f2a24]' : 'text-[#b2a282]'}`}>{value || '설정 필요'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
