'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminInquiryAnswerForm({ inquiryId, initialAnswer }: { inquiryId: string; initialAnswer?: string | null }) {
  const router = useRouter();
  const [answer, setAnswer] = useState(initialAnswer || '');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch('/api/admin/inquiries/answer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId, answer }),
    });
    setLoading(false);

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || '답변 저장 실패');
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4 rounded-2xl bg-[#fcfbf6] p-3">
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="고객에게 전달할 답변을 입력하세요"
        className="min-h-24 w-full rounded-xl bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#668f6b]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-2 w-full rounded-xl bg-[#214b36] py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {loading ? '저장 중...' : initialAnswer ? '답변 수정' : '답변 등록'}
      </button>
    </div>
  );
}
