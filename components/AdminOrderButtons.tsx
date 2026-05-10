'use client';
import { useRouter } from 'next/navigation';

export function AdminOrderButtons({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();

  async function updateStatus(nextStatus: string) {
    const res = await fetch('/api/orders/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: nextStatus }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || '상태 변경 실패');
      return;
    }

    router.refresh();
  }

  const actions = [
    { label: '결제완료', status: 'PAID', className: 'bg-green-50 text-green-700' },
    { label: '상품준비중', status: 'PREPARING', className: 'bg-[#e5f0dc] text-[#214b36]' },
    { label: '픽업준비', status: 'READY_FOR_PICKUP', className: 'bg-[#fff4bf] text-[#214b36]' },
    { label: '배송중', status: 'SHIPPING', className: 'bg-blue-50 text-blue-700' },
    { label: '완료처리', status: 'COMPLETED', className: 'bg-[#214b36] text-white' },
    { label: '대기처리', status: 'READY', className: 'bg-gray-100 text-gray-700' },
    { label: '취소승인', status: 'CANCELED', className: 'bg-red-50 text-red-600' },
    { label: '반품승인', status: 'RETURNED', className: 'bg-orange-50 text-orange-600' },
  ].filter((action) => action.status !== status);

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <button
          key={action.status}
          onClick={() => updateStatus(action.status)}
          className={`rounded-2xl py-3 text-xs font-black ${action.className}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
