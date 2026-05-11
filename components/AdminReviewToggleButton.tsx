'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminReviewToggleButton({
  reviewId,
  isHidden,
}: {
  reviewId: string;
  isHidden: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);

    const res = await fetch('/api/admin/reviews/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, isHidden: !isHidden }),
    });

    setLoading(false);

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || '후기 상태 변경 실패');
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`mt-3 w-full rounded-2xl py-3 text-xs font-black disabled:opacity-50 ${
        isHidden ? 'bg-[#e5f0dc] text-[#214b36]' : 'bg-red-50 text-red-600'
      }`}
    >
      {isHidden ? '후기 다시 노출' : '후기 숨기기'}
    </button>
  );
}
