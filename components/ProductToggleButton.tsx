'use client';
import { useRouter } from 'next/navigation';

export function ProductToggleButton({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        const res = await fetch('/api/admin/products/toggle', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, isActive: !isActive }),
        });
        if (!res.ok) {
          const error = await res.json();
          alert(error.message || '판매 상태 변경 실패');
          return;
        }
        router.refresh();
      }}
      className={`rounded-2xl px-4 py-2 text-xs font-black ${isActive ? 'bg-[#f1ead9] text-[#214b36]' : 'bg-[#214b36] text-white'}`}
    >
      {isActive ? '판매 숨김' : '판매 재개'}
    </button>
  );
}
