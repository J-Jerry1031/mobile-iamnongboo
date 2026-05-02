import Link from 'next/link';
import { Home, Search, ShoppingBag, UserRound, MessageCircle } from 'lucide-react';

export function BottomNav() {
  const item = 'flex flex-col items-center gap-1 text-[11px] text-[#214b36]';
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-[#eadfc8] bg-[#fffaf0]/95 px-2 pb-3 pt-2 backdrop-blur-xl safe-bottom">
      <Link className={item} href="/"><Home size={20}/>홈</Link>
      <Link className={item} href="/products/market"><Search size={20}/>상품</Link>
      <Link className={item} href="/cart"><ShoppingBag size={20}/>장바구니</Link>
      <Link className={item} href="/inquiries"><MessageCircle size={20}/>문의</Link>
      <Link className={item} href="/mypage"><UserRound size={20}/>마이</Link>
    </nav>
  );
}
