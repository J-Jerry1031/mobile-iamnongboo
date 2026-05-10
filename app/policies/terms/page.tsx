export default function TermsPage() {
  return <Policy title="이용약관" sections={[
    ['서비스 이용', '아이엠농부는 산지직송 신선식품과 생활 상품의 주문, 결제, 픽업 및 배송 안내를 제공합니다. 회원은 정확한 주문자 정보와 수령 정보를 입력해야 합니다.'],
    ['주문 및 결제', '주문은 결제 승인 또는 관리자의 주문 확인 후 접수됩니다. 재고, 입고 상태, 상품 품질에 따라 주문이 취소되거나 일정이 변경될 수 있습니다.'],
    ['회원 책임', '회원은 계정 정보를 안전하게 관리해야 하며, 부정 이용 또는 타인 정보 도용 시 서비스 이용이 제한될 수 있습니다.'],
    ['서비스 변경', '상품 구성, 가격, 배송 정책, 운영 시간은 매장 상황에 따라 변경될 수 있으며 중요한 변경 사항은 서비스 화면에 안내합니다.'],
  ]} />;
}

function Policy({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">POLICY</p>
        <h1 className="mt-2 text-2xl font-black">{title}</h1>
      </div>
      <div className="mt-5 space-y-3">
        {sections.map(([heading, body]) => (
          <section key={heading} className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-black text-[#1f2a24]">{heading}</h2>
            <p className="mt-3 text-sm leading-7 text-[#5b5141]">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
