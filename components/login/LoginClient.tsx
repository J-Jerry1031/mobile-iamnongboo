'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    router.push('/mypage');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="px-5 pt-8">
      <h1 className="text-2xl font-black text-[#214b36]">로그인</h1>
      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}
      <div className="mt-5 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="이메일" className="w-full rounded-2xl bg-white p-4" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="비밀번호" className="w-full rounded-2xl bg-white p-4" />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">로그인</button>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-[#214b36]">
        <Link href="/login?type=user" className="rounded-2xl bg-white p-3">고객 테스트</Link>
        <Link href="/signup" className="rounded-2xl bg-white p-3">회원가입</Link>
      </div>
    </form>
  );
}
