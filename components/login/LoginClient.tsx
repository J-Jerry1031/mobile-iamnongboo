'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/mypage';
  const reason = searchParams.get('reason');
  const [email, setEmail] = useState(searchParams.get('type') === 'user' ? 'test@iamnongbu.local' : 'admin@iamnongbu.local');
  const [password, setPassword] = useState(searchParams.get('type') === 'user' ? 'test1234!' : 'admin1234!');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError((await res.json()).message || '로그인 실패');
      return;
    }
    router.push(next.startsWith('/') ? next : '/mypage');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">LOGIN</p>
        <h1 className="mt-2 text-2xl font-black">로그인</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          주문내역, 후기, 문의 관리를 안전하게 확인해요.
        </p>
      </div>
      {reason && (
        <div className="mt-4 flex gap-3 rounded-3xl bg-white p-4 text-sm leading-6 text-[#5b5141]">
          <LockKeyhole className="mt-0.5 shrink-0 text-[#668f6b]" size={20} />
          <p>
            이 화면은 로그인 후 이용할 수 있어요. 로그인하면 요청하신 화면으로 바로 이동합니다.
          </p>
        </div>
      )}
      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}
      <div className="mt-5 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="이메일" className="w-full rounded-2xl bg-white p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="비밀번호" className="w-full rounded-2xl bg-white p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">로그인</button>
      <p className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-[#668f6b]">
        <ShieldCheck size={14} /> 테스트 계정으로 바로 확인할 수 있어요.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-[#214b36]">
        <Link href={`/login?type=user&next=${encodeURIComponent(next)}`} className="rounded-2xl bg-white p-3">고객 테스트</Link>
        <Link href="/signup" className="rounded-2xl bg-white p-3">회원가입</Link>
      </div>
    </form>
  );
}
