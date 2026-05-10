export default function RefundPage() {
  const sections = [
    ['신선식품 기준', '신선식품 특성상 단순 변심에 의한 반품은 제한될 수 있습니다. 다만 상품 이상, 오배송, 파손 등 판매자 귀책 사유는 확인 후 교환 또는 환불로 처리합니다.'],
    ['접수 방법', '상품 이상은 수령 당일 상품 사진과 주문번호를 함께 문의게시판에 남겨주세요. 상태 확인 후 가능한 빠르게 안내드립니다.'],
    ['픽업 주문', '픽업 준비 완료 안내 후 장시간 미수령으로 품질이 저하된 경우 교환/환불이 제한될 수 있습니다.'],
    ['환불 처리', '결제 취소 또는 환불은 결제 수단과 PG사 정책에 따라 처리 시간이 달라질 수 있습니다.'],
  ];

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">REFUND</p>
        <h1 className="mt-2 text-2xl font-black">교환/환불 안내</h1>
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
