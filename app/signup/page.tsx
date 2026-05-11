'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, UserPlus } from 'lucide-react';
import { KakaoPostcodeButton } from '@/components/KakaoPostcodeButton';
import { formatPhone } from '@/lib/phone';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zonecode, setZonecode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError('');
    setLoading(true);
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json()).message || '회원가입 실패');
      return;
    }
    router.push('/mypage');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">JOIN</p>
        <h1 className="mt-2 text-2xl font-black">회원가입</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          주문내역과 후기를 안전하게 관리할 계정을 만들어요.
        </p>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p>}

      <section className="mt-5 space-y-3 rounded-3xl bg-white p-5">
        <label className="block">
          <span className="mb-2 block text-xs font-black text-[#7a6b4d]">이름</span>
          <input name="name" placeholder="홍길동" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-black text-[#7a6b4d]">이메일</span>
          <input name="email" type="email" placeholder="farmer@example.com" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-black text-[#7a6b4d]">연락처</span>
          <input name="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={13} inputMode="tel" placeholder="010-0000-0000" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-black text-[#7a6b4d]">비밀번호</span>
          <input name="password" type="password" placeholder="영문+숫자 8자 이상" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
        </label>
      </section>

      <section className="mt-4 space-y-3 rounded-3xl bg-white p-5">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <MapPin size={18} className="text-[#668f6b]" />
          기본 배송지
        </h2>
        <p className="text-xs font-bold leading-5 text-[#7a6b4d]">
          미리 등록해두면 주문할 때 배송지가 자동으로 채워져요.
        </p>
        <input type="hidden" name="zonecode" value={zonecode} />
        <input type="hidden" name="address" value={address} />
        <div className="flex gap-2">
          <input
            value={zonecode}
            readOnly
            placeholder="우편번호"
            className="min-w-0 flex-1 rounded-2xl bg-[#fffaf0] p-4 outline-none"
          />
          <KakaoPostcodeButton
            onSelect={(data) => {
              setZonecode(data.zonecode);
              setAddress(data.address);
            }}
            className="shrink-0"
          />
        </div>
        <input
          value={address}
          readOnly
          placeholder="주소 검색을 눌러 주소를 입력해주세요"
          className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none"
        />
        <input
          name="addressDetail"
          placeholder="상세주소 예: 102호"
          className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]"
        />
      </section>

      <p className="mt-4 flex gap-2 rounded-2xl bg-[#e5f0dc] p-4 text-xs font-bold leading-5 text-[#214b36]">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        비밀번호는 암호화되어 저장되고, 관리자 화면에는 노출되지 않습니다.
      </p>

      <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-50">
        <UserPlus size={18} /> {loading ? '가입 중...' : '가입하고 시작하기'}
      </button>
      <Link href="/login?type=user" className="mt-3 block rounded-2xl bg-white py-4 text-center text-sm font-black text-[#214b36]">
        이미 계정이 있어요
      </Link>
    </form>
  );
}
