import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">마이페이지</h1><div className="mt-5 rounded-3xl bg-white p-5"><p className="font-black">{user.name}</p><p className="text-sm text-[#7a6b4d]">{user.email}</p><p className="mt-2 text-xs font-bold text-[#214b36]">{user.role}</p></div><div className="mt-4 grid gap-3"><Link href="/orders" className="rounded-2xl bg-white p-4 font-bold">주문내역 / 취소신청</Link><Link href="/inquiries" className="rounded-2xl bg-white p-4 font-bold">문의게시판</Link>{user.role === 'ADMIN' && <Link href="/admin" className="rounded-2xl bg-[#214b36] p-4 font-black text-white">관리자 페이지</Link>}</div><LogoutButton /></div>;
}
