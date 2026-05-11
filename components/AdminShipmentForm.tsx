'use client';

import { Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminShipmentForm({ orderId, carrier, trackingNumber, trackingUrl }: { orderId: string; carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/admin/orders/shipment', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        carrier: formData.get('carrier'),
        trackingNumber: formData.get('trackingNumber'),
        trackingUrl: formData.get('trackingUrl'),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage((await res.json()).message || '송장을 저장하지 못했어요.');
      return;
    }
    setMessage('송장 정보를 저장했어요.');
    router.refresh();
  }

  return (
    <form action={submit} className="mt-3 rounded-2xl bg-[#fcfbf6] p-3">
      <p className="mb-3 flex items-center gap-2 text-xs font-black text-[#214b36]">
        <Truck size={15} /> 배송 정보
      </p>
      <div className="grid gap-2">
        <input name="carrier" defaultValue={carrier || ''} placeholder="택배사 예: CJ대한통운" className="rounded-xl bg-white p-3 text-xs outline-none" />
        <input name="trackingNumber" defaultValue={trackingNumber || ''} placeholder="송장번호" className="rounded-xl bg-white p-3 text-xs outline-none" />
        <input name="trackingUrl" defaultValue={trackingUrl || ''} placeholder="배송조회 URL 선택" className="rounded-xl bg-white p-3 text-xs outline-none" />
      </div>
      {message && <p className="mt-2 text-xs font-bold text-[#214b36]">{message}</p>}
      <button disabled={loading} className="mt-3 w-full rounded-xl bg-[#214b36] py-3 text-xs font-black text-white disabled:opacity-50">
        {loading ? '저장 중...' : '송장 저장'}
      </button>
    </form>
  );
}
