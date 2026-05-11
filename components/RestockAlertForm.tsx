'use client';

import { Bell } from 'lucide-react';
import { useState } from 'react';
import { formatPhone } from '@/lib/phone';

export function RestockAlertForm({ productId }: { productId: string }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/restock-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, phone }),
    });
    setLoading(false);
    const data = await res.json();
    setMessage(res.ok ? '재입고 알림을 신청했어요.' : data.message || '신청하지 못했어요.');
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
      <p className="flex items-center gap-2 font-black text-[#1f2a24]">
        <Bell size={18} className="text-[#668f6b]" /> 재입고 알림
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#7a6b4d]">상품이 다시 준비되면 연락드릴게요.</p>
      <div className="mt-4 flex gap-2">
        <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={13} inputMode="tel" placeholder="010-0000-0000" className="min-w-0 flex-1 rounded-2xl bg-[#fffaf0] p-4 outline-none" />
        <button disabled={loading} className="shrink-0 rounded-2xl bg-[#214b36] px-4 text-sm font-black text-white disabled:opacity-50">
          신청
        </button>
      </div>
      {message && <p className="mt-3 rounded-2xl bg-[#e5f0dc] p-3 text-xs font-black text-[#214b36]">{message}</p>}
    </form>
  );
}
