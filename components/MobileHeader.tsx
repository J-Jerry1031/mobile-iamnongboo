import Link from 'next/link';
import { Menu } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="relative mx-auto flex h-[96px] max-w-[430px] items-center justify-center px-6">
        <Link href="/" className="iam-farmer-logo" aria-label="IAM FARMER 홈">
          <span>IAM</span>
          <strong>FARMER</strong>
        </Link>

        <button className="absolute right-6 top-1/2 -translate-y-1/2 text-[#1f2a24]">
          <Menu size={30} strokeWidth={2.4} />
        </button>
      </div>
    </header>
  );
}
