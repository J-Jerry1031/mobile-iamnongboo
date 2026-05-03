import Link from 'next/link';

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white">
      <Link href="/" className="flex items-center gap-2">
        
        <img
          src="/logo.png"
          alt="아이엠농부"
          className="h-6 w-auto"
        />

        <span className="text-lg font-black tracking-tight text-[#214b36]">
          아이엠농부
        </span>

      </Link>
    </header>
  );
}