import Link from 'next/link';
import { AlertCircle, ShoppingBag } from 'lucide-react';

export default async function FailPage({ searchParams }: { searchParams: Promise<{ code?: string; message?: string }> }) {
  const p = await searchParams;
  return <div className="px-5 pt-10 text-center">
    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fff1ef] text-red-500">
      <AlertCircle size={42} />
    </div>
    <h1 className="mt-5 text-2xl font-black text-[#214b36]">결제가 완료되지 않았어요</h1>
    <p className="mt-3 rounded-3xl bg-white p-5 text-sm leading-6 text-[#5b5141]">{p.message || p.code || '결제가 취소되었거나 승인되지 않았습니다. 장바구니는 그대로 유지돼요.'}</p>
    <Link href="/cart" className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] px-5 py-4 font-black text-white"><ShoppingBag size={18} /> 장바구니로 돌아가기</Link>
  </div>;
}
