'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronRight,
  Gift,
  Heart,
  Home,
  Leaf,
  Menu,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Store,
  TicketPercent,
  UserRound,
  X,
} from 'lucide-react';

const categoryLinks = [
  { label: '전체 상품', href: '/products/market', icon: Store },
  { label: '유기농', href: '/products/market?category=%EC%9C%A0%EA%B8%B0%EB%86%8D', icon: Leaf },
  { label: '과일', href: '/products/market?category=%EA%B3%BC%EC%9D%BC', icon: Gift },
  { label: '채소', href: '/products/market?category=%EC%B1%84%EC%86%8C', icon: Sprout },
  { label: '수산', href: '/products/market?category=%EC%88%98%EC%82%B0%EB%AC%BC', icon: Bell },
  { label: '반찬', href: '/products/market?category=%EB%B0%98%EC%B0%AC', icon: PackageCheck },
];

const shoppingLinks = [
  { label: '장바구니', href: '/cart', icon: ShoppingBag },
  { label: '주문내역', href: '/orders', icon: ReceiptText },
  { label: '배송지 관리', href: '/mypage/addresses', icon: Home },
  { label: '후기 관리', href: '/mypage/reviews', icon: Heart },
];

const serviceLinks = [
  { label: '아이엠농부 이야기', href: '/inquiries', icon: Heart },
  { label: '문의게시판', href: '/inquiries/board', icon: MessageCircle },
  { label: '고객 안내', href: '/policies', icon: ShieldCheck },
  { label: '사업자 정보', href: '/policies/business', icon: Store },
];

function MenuLink({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: typeof Home; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-[#fffaf0] p-3 active:scale-[.99]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#214b36]">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-black text-[#1f2a24]">{label}</span>
      <ChevronRight size={16} className="text-[#7a6b4d]" />
    </Link>
  );
}

export function openFullMenu() {
  window.dispatchEvent(new Event('iamnongbu:open-menu'));
}

export function FullMenuButton() {
  return (
    <button
      type="button"
      onClick={openFullMenu}
      className="flex flex-col items-center gap-1 text-[13px] font-medium text-[#111]"
      aria-label="전체 메뉴 열기"
    >
      <Menu size={29} strokeWidth={1.7} />
      메뉴
    </button>
  );
}

export function FullMenuDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('iamnongbu:open-menu', onOpen);
    return () => window.removeEventListener('iamnongbu:open-menu', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <button type="button" aria-label="전체 메뉴 닫기" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/35" />
          <aside className="absolute inset-y-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 justify-end overflow-hidden pointer-events-none">
            <div className="pointer-events-auto h-full w-[86%] max-w-[370px] animate-[menuSlideIn_.22s_ease-out] overflow-y-auto bg-white px-5 pb-8 pt-[max(22px,env(safe-area-inset-top))] shadow-[-20px_0_40px_rgba(0,0,0,.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-black text-[#668f6b]">IAM FARMER</p>
                  <h2 className="mt-1 text-2xl font-black text-[#1f2a24]">전체메뉴</h2>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#7a6b4d]">상품, 주문, 고객 안내를 빠르게 이동해요.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1ead9] text-[#214b36]" aria-label="전체 메뉴 닫기">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link href="/mypage" onClick={() => setOpen(false)} className="rounded-2xl bg-[#214b36] p-4 text-white active:scale-[.99]">
                  <UserRound size={20} />
                  <span className="mt-3 block text-sm font-black">마이페이지</span>
                  <span className="mt-1 block text-[11px] font-bold text-white/70">내 정보와 혜택</span>
                </Link>
                <Link href="/products/market?sort=new" onClick={() => setOpen(false)} className="rounded-2xl bg-[#e5f0dc] p-4 text-[#214b36] active:scale-[.99]">
                  <TicketPercent size={20} />
                  <span className="mt-3 block text-sm font-black">쿠폰 상품</span>
                  <span className="mt-1 block text-[11px] font-bold text-[#668f6b]">혜택가 보기</span>
                </Link>
              </div>

              <section className="mt-6">
                <h3 className="text-sm font-black text-[#1f2a24]">카테고리</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {categoryLinks.map((item) => (
                    <MenuLink key={item.label} {...item} onClick={() => setOpen(false)} />
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="text-sm font-black text-[#1f2a24]">내 쇼핑</h3>
                <div className="mt-3 space-y-2">
                  {shoppingLinks.map((item) => (
                    <MenuLink key={item.label} {...item} onClick={() => setOpen(false)} />
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="text-sm font-black text-[#1f2a24]">고객센터</h3>
                <div className="mt-3 space-y-2">
                  {serviceLinks.map((item) => (
                    <MenuLink key={item.label} {...item} onClick={() => setOpen(false)} />
                  ))}
                </div>
              </section>

              <Link href="/admin" onClick={() => setOpen(false)} className="mt-6 flex items-center justify-between rounded-2xl bg-[#fcfbf6] p-4 text-xs font-black text-[#7a6b4d] ring-1 ring-[#eadfce]">
                관리자 페이지
                <ChevronRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
