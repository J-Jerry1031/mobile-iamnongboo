import Link from 'next/link';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> }) {
  const params = await searchParams;
  let data: any = { message: '결제 정보가 없습니다.' };
  if (params.paymentKey && params.orderId && params.amount) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/toss/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentKey: params.paymentKey, orderId: params.orderId, amount: Number(params.amount) }), cache: 'no-store' });
    data = await res.json();
  }
  return <div className="px-5 pt-10 text-center"><div className="text-5xl">✅</div><h1 className="mt-4 text-2xl font-black text-[#214b36]">결제 테스트 완료</h1><p className="mt-3 rounded-3xl bg-white p-4 text-left text-xs break-all">{JSON.stringify(data, null, 2)}</p><Link href="/orders" className="mt-5 inline-block rounded-2xl bg-[#214b36] px-5 py-3 font-black text-white">주문내역 보기</Link></div>;
}
