'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton() { const router = useRouter(); return <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); router.push('/'); router.refresh(); }} className="mt-5 w-full rounded-2xl bg-[#f1ead9] py-4 font-bold">로그아웃</button>; }
