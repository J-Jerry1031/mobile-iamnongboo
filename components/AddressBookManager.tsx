'use client';

import { KakaoPostcodeButton } from '@/components/KakaoPostcodeButton';
import { formatPhone } from '@/lib/phone';
import { Home, PlusCircle, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  zonecode: string | null;
  address: string;
  detail: string | null;
  isDefault: boolean;
};

export function AddressBookManager({ initialAddresses, userName, userPhone }: { initialAddresses: SavedAddress[]; userName: string; userPhone: string }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [label, setLabel] = useState('우리집');
  const [recipient, setRecipient] = useState(userName);
  const [phone, setPhone] = useState(formatPhone(userPhone));
  const [zonecode, setZonecode] = useState('');
  const [address, setAddress] = useState('');
  const [detail, setDetail] = useState('');
  const [isDefault, setIsDefault] = useState(initialAddresses.length === 0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshAddresses() {
    const res = await fetch('/api/addresses', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { addresses: SavedAddress[] };
    setAddresses(data.addresses);
  }

  async function addAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, recipient, phone, zonecode, address, detail, isDefault }),
    });
    setLoading(false);

    if (!res.ok) {
      setMessage((await res.json()).message || '배송지를 저장하지 못했어요.');
      return;
    }

    setLabel('우리집');
    setZonecode('');
    setAddress('');
    setDetail('');
    setIsDefault(false);
    setMessage('배송지를 저장했어요.');
    await refreshAddresses();
  }

  async function setDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    await refreshAddresses();
  }

  async function removeAddress(id: string) {
    if (!confirm('이 배송지를 삭제할까요?')) return;
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    await refreshAddresses();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <PlusCircle size={19} className="text-[#668f6b]" />
          배송지 추가
        </h2>
        <form onSubmit={addAddress} className="mt-4 space-y-3">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="배송지 이름 예: 우리집" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="받는 분" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={13} inputMode="tel" placeholder="010-0000-0000" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          <div className="flex gap-2">
            <input value={zonecode} readOnly placeholder="우편번호" className="min-w-0 flex-1 rounded-2xl bg-[#fffaf0] p-4 outline-none" />
            <KakaoPostcodeButton
              onSelect={(data) => {
                setZonecode(data.zonecode);
                setAddress(data.address);
              }}
              className="shrink-0"
            />
          </div>
          <input value={address} readOnly placeholder="주소 검색을 눌러 주소를 입력해주세요" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none" />
          <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세주소" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          <label className="flex items-center gap-3 rounded-2xl bg-[#fcfbf6] p-4 text-sm font-black text-[#214b36]">
            <input checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} type="checkbox" className="h-4 w-4 accent-[#214b36]" />
            기본 배송지로 설정
          </label>
          {message && <p className="rounded-2xl bg-[#e5f0dc] p-3 text-xs font-black text-[#214b36]">{message}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-50">
            <PlusCircle size={18} /> {loading ? '저장 중...' : '배송지 저장'}
          </button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <Home size={19} className="text-[#668f6b]" />
          저장된 배송지
        </h2>
        <div className="mt-4 space-y-3">
          {addresses.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[#fffaf0] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-black text-[#1f2a24]">
                    {item.label}
                    {item.isDefault && <span className="rounded-full bg-[#214b36] px-2 py-1 text-[10px] text-white">기본</span>}
                  </p>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#7a6b4d]">
                    {item.recipient} · {formatPhone(item.phone)}<br />
                    {item.zonecode ? `(${item.zonecode}) ` : ''}{item.address} {item.detail || ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDefault(item.id)} disabled={item.isDefault} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-black text-[#214b36] disabled:opacity-45">
                  <Star size={14} /> 기본 설정
                </button>
                <button type="button" onClick={() => removeAddress(item.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-black text-red-600">
                  <Trash2 size={14} /> 삭제
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <p className="rounded-2xl bg-[#fffaf0] p-5 text-center text-sm font-bold text-[#7a6b4d]">
              저장된 배송지가 아직 없어요.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
