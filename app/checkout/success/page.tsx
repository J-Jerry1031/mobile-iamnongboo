import Link from 'next/link';
import { ClearCartOnSuccess } from '@/components/ClearCartOnSuccess';
import { CheckCircle2, Home, PackageCheck } from 'lucide-react';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> }) {
  const params = await searchParams;
  let message = '결제 정보가 없습니다.';
  let approved = false;
  if (params.paymentKey && params.orderId && params.amount) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/toss/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentKey: params.paymentKey, orderId: params.orderId, amount: Number(params.amount) }), cache: 'no-store' });
    const data = await res.json() as { message?: string; status?: string; approvedAt?: string };
    approved = res.ok;
    message = res.ok ? '주문과 결제가 정상적으로 완료됐어요.' : data.message || '결제 승인 중 문제가 생겼어요.';
  }
  return <div className="px-5 pt-10 text-center">
    {approved && <ClearCartOnSuccess />}
    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
      <CheckCircle2 size={42} />
    </div>
    <h1 className="mt-5 text-2xl font-black text-[#214b36]">{approved ? '주문이 완료됐어요' : '결제 확인이 필요해요'}</h1>
    <p className="mt-3 rounded-3xl bg-white p-5 text-sm leading-6 text-[#5b5141]">{message}</p>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <Link href="/orders" className="flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] px-4 py-4 font-black text-white"><PackageCheck size={18} /> 주문내역</Link>
      <Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-black text-[#214b36]"><Home size={18} /> 홈으로</Link>
    </div>
  </div>;
}
