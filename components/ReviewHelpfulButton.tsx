'use client';

import { useEffect, useState } from 'react';

export function ReviewHelpfulButton({
  reviewId,
  initialCount,
}: {
  reviewId: string;
  initialCount: number;
}) {
  const storageKey = `iamnongbu-helpful-${reviewId}`;
  const [count, setCount] = useState(initialCount);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setDone(window.localStorage.getItem(storageKey) === '1');
    });
  }, [storageKey]);

  async function submit() {
    if (done || loading) return;
    setLoading(true);

    const res = await fetch('/api/reviews/helpful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId }),
    });

    if (res.ok) {
      const data = await res.json();
      setCount(data.helpfulCount);
      setDone(true);
      window.localStorage.setItem(storageKey, '1');
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={done || loading}
      className="mt-3 rounded-full bg-[#f4f7f1] px-3 py-2 text-xs font-black text-[#214b36] disabled:opacity-60"
    >
      도움돼요 {count}
    </button>
  );
}
