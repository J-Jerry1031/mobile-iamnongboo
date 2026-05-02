'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@iamnongbu.local', password: 'test1234!' }) });
    if (!res.ok) { setError('현재 MVP에서는 테스트 고객 계정으로 로그인해줘.'); return; }
    router.push('/mypage');
    router.refresh();
  }

  return <form onSubmit={submit} className="px-5 pt-8"><h1 className="text-2xl font-black text-[#214b36]">회원가입</h1>{error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}<p className="mt-5 rounded-3xl bg-white p-5 text-sm leading-6">MVP에서는 고객 테스트 계정으로 바로 로그인됩니다. 실제 회원가입 DB 저장은 다음 단계에서 확장하면 됩니다.</p><button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">테스트 고객으로 시작</button></form>;
}
