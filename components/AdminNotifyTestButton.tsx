'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';

export function AdminNotifyTestButton() {
  const [loading, setLoading] = useState(false);

  async function testNotify() {
    setLoading(true);
    const res = await fetch('/api/admin/notify/test', { method: 'POST' });
    setLoading(false);

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '알림 테스트 실패');
      return;
    }
    alert('Slack 테스트 알림을 보냈어요.');
  }

  return (
    <button
      type="button"
      onClick={testNotify}
      disabled={loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 text-sm font-black text-white disabled:opacity-50"
    >
      <Send size={17} /> {loading ? '전송 중...' : 'Slack 알림 테스트'}
    </button>
  );
}
