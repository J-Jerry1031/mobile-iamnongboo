import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { LogoutButton } from '@/components/LogoutButton';
import { prisma } from '@/lib/prisma';
import {
  ChevronRight,
  ClipboardList,
  Heart,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [orderCount, reviewCount, inquiryCount] = await Promise.all([
    prisma.order.count({ where: user.role === 'ADMIN' ? {} : { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.inquiry.count({ where: { userId: user.id } }),
  ]);

  const menuItems = [
    {
      title: '주문정보',
      description: `${orderCount}건의 주문내역과 취소/반품 상태를 확인해요`,
      href: '/orders',
      icon: PackageCheck,
    },
    {
      title: '후기 관리',
      description: `${reviewCount}개의 작성 후기가 있어요`,
      href: '/mypage/reviews',
      icon: Star,
    },
    {
      title: '문의 내역',
      description: `${inquiryCount}개의 문의를 확인할 수 있어요`,
      href: '/inquiries/board',
      icon: MessageCircle,
    },
    {
      title: '찜한 상품',
      description: '관심 상품 기능을 준비 중이에요',
      href: '/products/market',
      icon: Heart,
    },
  ];

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">MY FARMER</p>
        <h1 className="mt-2 text-2xl font-black">마이페이지</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          내 정보, 주문, 후기와 문의를 한 곳에서 관리해요.
        </p>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
            <UserRound size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black text-[#1f2a24]">{user.name}</p>
            <p className="mt-1 truncate text-sm text-[#7a6b4d]">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-[#fcfbf6] px-3 py-1 text-xs font-black text-[#214b36]">
              {user.role === 'ADMIN' ? '관리자' : '회원'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[#fcfbf6] p-3">
            <p className="text-lg font-black text-[#214b36]">{user.points.toLocaleString()}P</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">포인트</p>
          </div>
          <div className="rounded-2xl bg-[#fcfbf6] p-3">
            <p className="text-lg font-black text-[#214b36]">{orderCount}</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">주문</p>
          </div>
          <div className="rounded-2xl bg-[#fcfbf6] p-3">
            <p className="text-lg font-black text-[#214b36]">{reviewCount}</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">후기</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <ShieldCheck size={19} className="text-[#668f6b]" />
          개인정보
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="font-bold text-[#7a6b4d]">이름</span>
            <span className="font-black">{user.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-bold text-[#7a6b4d]">이메일</span>
            <span className="truncate font-black">{user.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-bold text-[#7a6b4d]">연락처</span>
            <span className="font-black">{user.phone || '미등록'}</span>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3">
        {menuItems.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm active:scale-[.99]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
              <Icon size={21} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black text-[#1f2a24]">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-[#7a6b4d]">{description}</span>
            </span>
            <ChevronRight size={18} className="text-[#7a6b4d]" />
          </Link>
        ))}

        {user.role === 'ADMIN' && (
          <Link href="/admin" className="flex items-center gap-3 rounded-3xl bg-[#214b36] p-4 font-black text-white">
            <ClipboardList size={20} />
            관리자 페이지
          </Link>
        )}
      </section>

      <LogoutButton />
    </div>
  );
}
