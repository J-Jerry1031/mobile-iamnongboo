export default function PrivacyPage() {
  const sections = [
    ['수집 항목', '회원가입 시 이름, 이메일, 연락처, 비밀번호 해시를 수집합니다. 주문 시 주문자명, 연락처, 수령 주소 또는 픽업 요청사항, 주문 상품 정보를 수집합니다.'],
    ['이용 목적', '수집한 정보는 회원 식별, 주문 접수, 결제 확인, 픽업/배송 안내, 문의 응대, 후기 및 포인트 관리에 사용합니다.'],
    ['보관 기간', '회원 정보는 탈퇴 또는 삭제 요청 시까지 보관하며, 주문 및 결제 관련 정보는 관련 법령에 따른 보관 기간 동안 보관할 수 있습니다.'],
    ['보호 조치', '비밀번호는 해시 처리하여 저장하며, 관리자 화면에서도 원문 비밀번호는 노출되지 않습니다. 민감한 서버 키는 브라우저에 노출하지 않습니다.'],
  ];

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">PRIVACY</p>
        <h1 className="mt-2 text-2xl font-black">개인정보처리방침</h1>
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
