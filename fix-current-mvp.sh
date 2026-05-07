#!/usr/bin/env bash
set -e

# 아이엠농부 모([docs.tosspayments.com](https://docs.tosspayments.com/guides/v2/payment-widget/integration-window?utm_source=chatgpt.com)).js App Router 프로젝트 루트에서 실행:
# chmod +x setup-mobile-shop.sh && ./se([nextjs.org](https://nextjs.org/docs/app/guides/authentication?utm_source=chatgpt.com))n
mkdir -p app/{products/[id],cart,checkout,checkout/success,checkout/fail,login,signup,mypage,orders,returns,inquiries,reviews,admin,admin/orders,admin/members,admin/products,api/toss/confirm,api/auth/[...nextauth]}
mkdir -p components lib data prisma

cat > package.extra.json <<'EOF'
{
  "dependencies_to_install": [
    "@tosspayments/tosspayments-sdk",
    "@prisma/client",
    "prisma",
    "next-auth",
    "bcryptjs",
    "zod",
    "zustand",
    "lucide-react"
  ],
  "install_command": "pnpm add @tosspayments/tosspayments-sdk @prisma/client prisma next-auth bcryptjs zod zustand lucide-react && pnpm add -D @types/bcryptjs"
}
EOF

cat > .env.example <<'EOF'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change-this-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
TOSS_CLIENT_KEY="test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
TOSS_SECRET_KEY="test_gsk_docs_Ovk5rk1EwkEbP0W43n07xlzm"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EOF

cat > prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  READY
  PAID
  CANCEL_REQUESTED
  CANCELED
  RETURN_REQUESTED
  RETURNED
}

enum InquiryStatus {
  OPEN
  ANSWERED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  orders    Order[]
  reviews   Review[]
  inquiries Inquiry[]
}

model Product {
  id          String   @id @default(cuid())
  name        String
  category    String
  description String
  price       Int
  image       String
  badge       String?
  stock       Int      @default(100)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  reviews     Review[]
}

model Order {
  id          String      @id @default(cuid())
  orderNo     String      @unique
  userId      String?
  user        User?       @relation(fields: [userId], references: [id])
  buyerName   String
  buyerPhone  String
  address     String?
  totalAmount Int
  status      OrderStatus @default(READY)
  paymentKey  String?
  tossOrderId String?     @unique
  createdAt   DateTime    @default(now())
  items       OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  name      String
  price     Int
  quantity  Int
}

model Review {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  rating    Int
  content   String
  createdAt DateTime @default(now())
}

model Inquiry {
  id        String        @id @default(cuid())
  userId    String?
  user      User?         @relation(fields: [userId], references: [id])
  title     String
  content   String
  answer    String?
  status    InquiryStatus @default(OPEN)
  createdAt DateTime      @default(now())
}
EOF

cat > lib/prisma.ts <<'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF

cat > lib/format.ts <<'EOF'
export const won = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';
EOF

cat > data/products.ts <<'EOF'
export const seedProducts = [
  {
    name: '프리미엄 제철 사과',
    category: '과일',
    description: '아침마다 선별한 산지직송 제철 사과입니다.',
    price: 12900,
    image: '/products/apple.jpg',
    badge: '산지직송'
  },
  {
    name: '유기농 쌈채소 모음',
    category: '채소',
    description: '가족 식탁에 바로 올리기 좋은 신선 채소 구성입니다.',
    price: 6900,
    image: '/products/greens.jpg',
    badge: '유기농'
  },
  {
    name: '당일 손질 반건조 생선',
    category: '수산물',
    description: '30분 전 예약 후 매장에서 따뜻하게 받아보세요.',
    price: 9900,
    image: '/products/fish.jpg',
    badge: '예약추천'
  }
];
EOF

cat > prisma/seed.ts <<'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedProducts } from '../data/products';

const prisma = new PrismaClient();

async function main() {
  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    });
  }

  await prisma.user.upsert({
    where: { email: 'admin@iamnongbu.local' },
    update: {},
    create: {
      name: '아이엠농부 관리자',
      email: 'admin@iamnongbu.local',
      phone: '010-2054-1688',
      password: await bcrypt.hash('admin1234!', 10),
      role: 'ADMIN',
    },
  });
}

main().finally(() => prisma.$disconnect());
EOF

cat > auth.ts <<'EOF'
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '');
        const password = String(credentials?.password || '');
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
});
EOF

cat > app/api/auth/[...nextauth]/route.ts <<'EOF'
export { GET, POST } from '@/auth';
EOF

cat > lib/cart-store.ts <<'EOF'
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>) => void;
  remove: (id: string) => void;
  clear: () => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const exists = state.items.find((x) => x.id === item.id);
          if (exists) {
            return { items: state.items.map((x) => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x) };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((x) => x.id !== id) })),
      clear: () => set({ items: [] }),
      inc: (id) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: x.quantity + 1 } : x) })),
      dec: (id) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x) })),
    }),
    { name: 'iamnongbu-cart' }
  )
);
EOF

cat > app/globals.css <<'EOF'
@import "tailwindcss";

:root {
  --farm-green: #214b36;
  --farm-light: #f6f1e7;
  --farm-cream: #fffaf0;
}

body {
  background: var(--farm-cream);
  color: #1f2a24;
}

.mobile-shell {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  background: #fffaf0;
  box-shadow: 0 0 40px rgba(0,0,0,.08);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
EOF

cat > components/MobileHeader.tsx <<'EOF'
import Link from 'next/link';
import { ShoppingBag, UserRound } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#eadfc8] bg-[#fffaf0]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between px-4">
        <Link href="/" className="font-serif text-xl font-black tracking-tight text-[#214b36]">아이엠농부</Link>
        <nav className="flex items-center gap-3 text-[#214b36]">
          <Link href="/mypage"><UserRound size={22} /></Link>
          <Link href="/cart" className="relative"><ShoppingBag size={23} /></Link>
        </nav>
      </div>
    </header>
  );
}
EOF

cat > components/Footer.tsx <<'EOF'
export function Footer() {
  return (
    <footer className="mt-12 bg-[#203d2c] px-5 py-8 text-xs leading-6 text-[#efe7d3]">
      <div className="font-bold text-white">아이엠농부</div>
      <p className="mt-2">주소 : 경기도 화성시 동탄솔빛로 65-1, 1층 아이엠농부</p>
      <p>연락처 : 010-2054-1688</p>
      <p className="mt-3">이용약관 · 개인정보처리방침 · 배송/교환/반품 안내</p>
      <p className="mt-3 text-[#c8bfa9]">Real Farmer, Real Freshness.</p>
    </footer>
  );
}
EOF

cat > components/BottomNav.tsx <<'EOF'
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
EOF

cat > components/AddToCartButton.tsx <<'EOF'
'use client';

import { useCart } from '@/lib/cart-store';

export function AddToCartButton({ product }: { product: { id: string; name: string; price: number; image: string } }) {
  const add = useCart((s) => s.add);
  return (
    <button
      onClick={() => add(product)}
      className="mt-4 w-full rounded-2xl bg-[#214b36] px-5 py-4 text-base font-bold text-white shadow-lg shadow-green-900/20 active:scale-[.99]"
    >
      장바구니 담기
    </button>
  );
}
EOF

cat > app/layout.tsx <<'EOF'
import type { Metadata } from 'next';
import './globals.css';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '아이엠농부',
  description: '산지직송 신선함을 담은 동네 프리미엄 마켓',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-shell">
          <MobileHeader />
          <main className="pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
EOF

cat > app/page.tsx <<'EOF'
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Footer } from '@/components/Footer';
import { won } from '@/lib/format';

export default async function HomePage() {
  const products = await prisma.product.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: 'desc' } });
  return (
    <>
      <section className="px-5 pt-5">
        <div className="rounded-[2rem] bg-[#214b36] p-6 text-white shadow-xl shadow-green-900/20">
          <p className="text-sm text-[#d8e6cd]">Real Farmer, Real Freshness</p>
          <h1 className="mt-3 text-3xl font-black leading-tight">농부가 고른<br />오늘의 신선함</h1>
          <p className="mt-3 text-sm leading-6 text-[#edf3e8]">동탄 아이엠농부에서 매일 선별한 과일, 채소, 유기농 상품을 모바일로 편하게 만나보세요.</p>
          <Link href="/products/market" className="mt-5 inline-flex rounded-full bg-[#f5d87a] px-5 py-3 text-sm font-black text-[#214b36]">오늘 상품 보기</Link>
        </div>
      </section>

      <section className="px-5 pt-7">
        <div className="grid grid-cols-3 gap-3 text-center text-sm font-bold text-[#214b36]">
          {['🍎 과일', '🥬 채소', '🐟 수산'].map((x) => <div key={x} className="rounded-2xl bg-white p-3 shadow-sm">{x}</div>)}
        </div>
      </section>

      <section className="px-5 pt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-black text-[#214b36]">추천 상품</h2>
          <Link href="/products/market" className="text-sm font-bold text-[#7a6b4d]">전체보기</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="rounded-3xl bg-white p-3 shadow-sm">
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#f1ead9] text-4xl">🌿</div>
              <p className="mt-3 line-clamp-2 text-sm font-black">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
EOF

cat > app/products/[id]/page.tsx <<'EOF'
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AddToCartButton } from '@/components/AddToCartButton';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { reviews: { orderBy: { createdAt: 'desc' } } } });
  if (!product) notFound();

  return (
    <div className="px-5 pt-5">
      <div className="flex aspect-square items-center justify-center rounded-[2rem] bg-[#f1ead9] text-7xl">🌿</div>
      {product.badge && <p className="mt-5 inline-flex rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{product.badge}</p>}
      <h1 className="mt-3 text-2xl font-black text-[#1f2a24]">{product.name}</h1>
      <p className="mt-2 text-2xl font-black text-[#214b36]">{won(product.price)}</p>
      <p className="mt-4 rounded-3xl bg-white p-5 text-sm leading-7 text-[#5b5141]">{product.description}</p>
      <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, image: product.image }} />

      <section className="mt-8">
        <h2 className="text-lg font-black">상품 후기</h2>
        <form action={`/reviews?productId=${product.id}`} className="mt-3 rounded-3xl bg-white p-4">
          <p className="text-sm text-[#7a6b4d]">후기 작성 기능은 /reviews 페이지에서 연결됩니다.</p>
        </form>
        <div className="mt-4 space-y-3">
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white p-4 text-sm">
              <p>{'⭐'.repeat(r.rating)}</p>
              <p className="mt-2">{r.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
EOF

cat > app/products/[id]/not-found.tsx <<'EOF'
export default function NotFound() {
  return <div className="p-5">상품을 찾을 수 없어요.</div>;
}
EOF

cat > app/products/market/page.tsx <<'EOF'
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';

export default async function ProductList() {
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">오늘의 상품</h1>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="rounded-3xl bg-white p-3 shadow-sm">
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#f1ead9] text-4xl">🌿</div>
            <p className="mt-3 text-sm font-black">{p.name}</p>
            <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
EOF

cat > app/cart/page.tsx <<'EOF'
'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';

export default function CartPage() {
  const { items, inc, dec, remove } = useCart();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">장바구니</h1>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f1ead9] text-3xl">🌿</div>
            <div className="flex-1">
              <p className="font-black">{item.name}</p>
              <p className="text-sm font-bold text-[#214b36]">{won(item.price)}</p>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => dec(item.id)} className="rounded-full bg-[#f1ead9] px-3 py-1">-</button>
                <span>{item.quantity}</span>
                <button onClick={() => inc(item.id)} className="rounded-full bg-[#f1ead9] px-3 py-1">+</button>
                <button onClick={() => remove(item.id)} className="ml-auto text-xs text-red-500">삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-[#214b36] p-5 text-white">
        <div className="flex justify-between text-lg font-black"><span>총 결제금액</span><span>{won(total)}</span></div>
        <Link href="/checkout" className="mt-4 block rounded-2xl bg-[#f5d87a] py-4 text-center font-black text-[#214b36]">주문하기</Link>
      </div>
    </div>
  );
}
EOF

cat > app/checkout/page.tsx <<'EOF'
'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function pay() {
    if (total <= 0) return alert('장바구니가 비어 있어요.');
    const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
    const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' });
    const orderId = `IAMNONGBU-${Date.now()}`;

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: total },
      orderId,
      orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/fail`,
      customerEmail: 'guest@iamnongbu.local',
      customerName: '아이엠농부 고객',
    });
  }

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">주문/결제</h1>
      <div className="mt-5 rounded-3xl bg-white p-5">
        <p className="font-black">주문상품</p>
        <div className="mt-3 space-y-2 text-sm">
          {items.map((item) => <div key={item.id} className="flex justify-between"><span>{item.name} × {item.quantity}</span><span>{won(item.price * item.quantity)}</span></div>)}
        </div>
        <div className="mt-5 flex justify-between border-t pt-4 text-lg font-black"><span>총액</span><span>{won(total)}</span></div>
      </div>
      <button onClick={pay} className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">토스페이먼츠 테스트 결제</button>
    </div>
  );
}
EOF

cat > app/checkout/success/page.tsx <<'EOF'
import Link from 'next/link';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> }) {
  const params = await searchParams;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/toss/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey: params.paymentKey, orderId: params.orderId, amount: Number(params.amount) }),
    cache: 'no-store',
  });
  const data = await res.json();

  return (
    <div className="px-5 pt-10 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="mt-4 text-2xl font-black text-[#214b36]">결제 테스트 완료</h1>
      <p className="mt-3 rounded-3xl bg-white p-4 text-left text-xs break-all">{JSON.stringify(data, null, 2)}</p>
      <Link href="/" className="mt-5 inline-block rounded-2xl bg-[#214b36] px-5 py-3 font-black text-white">홈으로</Link>
    </div>
  );
}
EOF

cat > app/checkout/fail/page.tsx <<'EOF'
import Link from 'next/link';

export default async function FailPage({ searchParams }: { searchParams: Promise<{ code?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <div className="px-5 pt-10 text-center">
      <div className="text-5xl">🥲</div>
      <h1 className="mt-4 text-2xl font-black text-[#214b36]">결제가 취소/실패됐어요</h1>
      <p className="mt-3 text-sm">{params.message || params.code}</p>
      <Link href="/cart" className="mt-5 inline-block rounded-2xl bg-[#214b36] px-5 py-3 font-black text-white">장바구니로</Link>
    </div>
  );
}
EOF

cat > app/api/toss/confirm/route.ts <<'EOF'
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { paymentKey, orderId, amount } = await req.json();
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encryptedSecretKey = Buffer.from(secretKey + ':').toString('base64');

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encryptedSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
EOF

cat > app/signup/page.tsx <<'EOF'
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

async function signup(formData: FormData) {
  'use server';
  const name = String(formData.get('name'));
  const email = String(formData.get('email'));
  const phone = String(formData.get('phone'));
  const password = String(formData.get('password'));
  await prisma.user.create({ data: { name, email, phone, password: await bcrypt.hash(password, 10) } });
  redirect('/login');
}

export default function SignupPage() {
  return (
    <form action={signup} className="px-5 pt-8">
      <h1 className="text-2xl font-black text-[#214b36]">회원가입</h1>
      <div className="mt-5 space-y-3">
        <input name="name" placeholder="이름" className="w-full rounded-2xl bg-white p-4" />
        <input name="email" type="email" placeholder="이메일" className="w-full rounded-2xl bg-white p-4" />
        <input name="phone" placeholder="휴대폰번호" className="w-full rounded-2xl bg-white p-4" />
        <input name="password" type="password" placeholder="비밀번호" className="w-full rounded-2xl bg-white p-4" />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">가입하기</button>
    </form>
  );
}
EOF

cat > app/login/page.tsx <<'EOF'
import Link from 'next/link';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';

async function login(formData: FormData) {
  'use server';
  await signIn('credentials', { email: formData.get('email'), password: formData.get('password'), redirectTo: '/mypage' });
  redirect('/mypage');
}

export default function LoginPage() {
  return (
    <form action={login} className="px-5 pt-8">
      <h1 className="text-2xl font-black text-[#214b36]">로그인</h1>
      <div className="mt-5 space-y-3">
        <input name="email" type="email" placeholder="이메일" className="w-full rounded-2xl bg-white p-4" />
        <input name="password" type="password" placeholder="비밀번호" className="w-full rounded-2xl bg-white p-4" />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">로그인</button>
      <Link href="/signup" className="mt-4 block text-center text-sm font-bold text-[#214b36]">아직 회원이 아니신가요?</Link>
    </form>
  );
}
EOF

cat > app/mypage/page.tsx <<'EOF'
import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await auth();
  if (!session) redirect('/login');
  const isAdmin = (session.user as any)?.role === 'ADMIN';
  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">마이페이지</h1>
      <div className="mt-5 rounded-3xl bg-white p-5">
        <p className="font-black">{session.user?.name}</p>
        <p className="text-sm text-[#7a6b4d]">{session.user?.email}</p>
      </div>
      <div className="mt-4 grid gap-3">
        <Link href="/orders" className="rounded-2xl bg-white p-4 font-bold">주문내역 / 취소신청</Link>
        <Link href="/returns" className="rounded-2xl bg-white p-4 font-bold">반품신청</Link>
        <Link href="/inquiries" className="rounded-2xl bg-white p-4 font-bold">문의게시판</Link>
        {isAdmin && <Link href="/admin" className="rounded-2xl bg-[#214b36] p-4 font-black text-white">관리자 페이지</Link>}
      </div>
      <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
        <button className="mt-5 w-full rounded-2xl bg-[#f1ead9] py-4 font-bold">로그아웃</button>
      </form>
    </div>
  );
}
EOF

cat > app/admin/page.tsx <<'EOF'
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/login');
  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">아이엠농부 Admin</h1>
      <div className="mt-5 grid gap-3">
        <Link href="/admin/orders" className="rounded-2xl bg-white p-4 font-bold">주문관리</Link>
        <Link href="/admin/members" className="rounded-2xl bg-white p-4 font-bold">회원관리</Link>
        <Link href="/admin/products" className="rounded-2xl bg-white p-4 font-bold">상품관리</Link>
      </div>
    </div>
  );
}
EOF

cat > app/admin/orders/page.tsx <<'EOF'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';

export default async function AdminOrdersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/login');
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">주문관리</h1><div className="mt-5 space-y-3">{orders.map(o => <div key={o.id} className="rounded-3xl bg-white p-4 text-sm"><p className="font-black">{o.orderNo}</p><p>{o.buyerName} / {o.buyerPhone}</p><p>{won(o.totalAmount)} / {o.status}</p></div>)}</div></div>;
}
EOF

cat > app/admin/members/page.tsx <<'EOF'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function AdminMembersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/login');
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">회원관리</h1><div className="mt-5 space-y-3">{users.map(u => <div key={u.id} className="rounded-3xl bg-white p-4 text-sm"><p className="font-black">{u.name}</p><p>{u.email}</p><p>{u.phone}</p><p>{u.role}</p></div>)}</div></div>;
}
EOF

cat > app/admin/products/page.tsx <<'EOF'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';

export default async function AdminProductsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/login');
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">상품관리</h1><div className="mt-5 space-y-3">{products.map(p => <div key={p.id} className="rounded-3xl bg-white p-4 text-sm"><p className="font-black">{p.name}</p><p>{p.category} / {won(p.price)} / 재고 {p.stock}</p></div>)}</div></div>;
}
EOF

cat > app/inquiries/page.tsx <<'EOF'
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

async function createInquiry(formData: FormData) {
  'use server';
  await prisma.inquiry.create({ data: { title: String(formData.get('title')), content: String(formData.get('content')) } });
  redirect('/inquiries');
}

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">문의게시판</h1>
      <form action={createInquiry} className="mt-5 space-y-3 rounded-3xl bg-white p-4">
        <input name="title" placeholder="문의 제목" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
        <textarea name="content" placeholder="문의 내용" className="min-h-28 w-full rounded-2xl bg-[#fffaf0] p-4" />
        <button className="w-full rounded-2xl bg-[#214b36] py-3 font-black text-white">문의 남기기</button>
      </form>
      <div className="mt-5 space-y-3">{inquiries.map(i => <div key={i.id} className="rounded-3xl bg-white p-4"><p className="font-black">{i.title}</p><p className="mt-2 text-sm">{i.content}</p><p className="mt-2 text-xs text-[#7a6b4d]">{i.status}</p></div>)}</div>
    </div>
  );
}
EOF

cat > app/orders/page.tsx <<'EOF'
export default function OrdersPage() {
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">주문내역</h1><p className="mt-5 rounded-3xl bg-white p-5 text-sm">결제 성공 시 Order DB 저장 로직을 추가하면 여기에 주문 내역, 취소신청 버튼이 표시됩니다.</p></div>;
}
EOF

cat > app/returns/page.tsx <<'EOF'
export default function ReturnsPage() {
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">반품신청</h1><p className="mt-5 rounded-3xl bg-white p-5 text-sm">주문 상세에서 반품 가능 상태일 때 신청하도록 연결하면 됩니다.</p></div>;
}
EOF

cat > app/reviews/page.tsx <<'EOF'
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

async function createReview(formData: FormData) {
  'use server';
  const productId = String(formData.get('productId'));
  await prisma.review.create({ data: { productId, rating: Number(formData.get('rating') || 5), content: String(formData.get('content')) } });
  redirect(`/products/${productId}`);
}

export default function ReviewsPage({ searchParams }: { searchParams: { productId?: string } }) {
  return <form action={createReview} className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">후기 작성</h1><input type="hidden" name="productId" value={searchParams.productId} /><select name="rating" className="mt-5 w-full rounded-2xl bg-white p-4"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option></select><textarea name="content" placeholder="후기를 남겨주세요" className="mt-3 min-h-32 w-full rounded-2xl bg-white p-4" /><button className="mt-3 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">등록</button></form>;
}
EOF

echo "\n✅ 파일 생성 완료"
echo "다음 명령어 실행:"
echo "pnpm add @tosspayments/tosspayments-sdk @prisma/client prisma next-auth bcryptjs zod zustand lucide-react && pnpm add -D @types/bcryptjs"
echo "cp .env.example .env.local"
echo "pnpm prisma db push"
echo "pnpm prisma db seed"
cat > app/api/orders/create/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const { items, buyerName, buyerPhone, address, tossOrderId } = body;

  if (!items?.length) {
    return NextResponse.json({ message: '장바구니가 비어 있어요.' }, { status: 400 });
  }

  const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const orderNo = `IMF-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      tossOrderId,
      userId: (session?.user as any)?.id,
      buyerName,
      buyerPhone,
      address,
      totalAmount,
      status: 'READY',
      items: {
        create: items.map((item: any) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}
EOF

mkdir -p app/api/orders/create app/api/orders/status app/api/admin/products/create

cat > app/api/orders/status/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await auth();
  const body = await req.json();
  const { orderId, status } = body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ message: '주문을 찾을 수 없어요.' }, { status: 404 });

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isOwner = order.userId && order.userId === (session?.user as any)?.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ message: '권한이 없어요.' }, { status: 403 });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  return NextResponse.json(updated);
}
EOF

cat > app/api/admin/products/create/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: '관리자만 접근할 수 있어요.' }, { status: 403 });
  }

  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description,
      price: Number(body.price),
      stock: Number(body.stock || 100),
      image: body.image || '/products/default.jpg',
      badge: body.badge || null,
      isActive: true,
    },
  });

  return NextResponse.json(product);
}
EOF

cat > components/CheckoutClient.tsx <<'EOF'
'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { useState } from 'react';

export function CheckoutClient() {
  const items = useCart((s) => s.items);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [address, setAddress] = useState('');
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function pay() {
    if (!items.length) return alert('장바구니가 비어 있어요.');
    if (!buyerName || !buyerPhone) return alert('이름과 연락처를 입력해줘.');

    const tossOrderId = `IAMNONGBU-${Date.now()}`;

    await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, buyerName, buyerPhone, address, tossOrderId }),
    });

    const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
    const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' });

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: total },
      orderId: tossOrderId,
      orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/fail`,
      customerName: buyerName,
      customerMobilePhone: buyerPhone.replaceAll('-', ''),
    });
  }

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">주문/결제</h1>

      <section className="mt-5 rounded-3xl bg-white p-5">
        <h2 className="font-black">주문자 정보</h2>
        <div className="mt-4 space-y-3">
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="이름" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="연락처 010-0000-0000" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="배송지 또는 픽업 요청사항" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5">
        <p className="font-black">주문상품</p>
        <div className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>{item.name} × {item.quantity}</span>
              <span>{won(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-between border-t pt-4 text-lg font-black">
          <span>총액</span><span>{won(total)}</span>
        </div>
      </section>

      <button onClick={pay} className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">
        토스페이먼츠 테스트 결제
      </button>
    </div>
  );
}
EOF

cat > app/checkout/page.tsx <<'EOF'
import { CheckoutClient } from '@/components/CheckoutClient';

export default function CheckoutPage() {
  return <CheckoutClient />;
}
EOF

cat > app/api/toss/confirm/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { paymentKey, orderId, amount } = await req.json();
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encryptedSecretKey = Buffer.from(secretKey + ':').toString('base64');

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encryptedSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();

  if (response.ok) {
    await prisma.order.updateMany({
      where: { tossOrderId: orderId },
      data: {
        status: 'PAID',
        paymentKey,
      },
    });
  }

  return NextResponse.json(data, { status: response.status });
}
EOF

cat > app/orders/page.tsx <<'EOF'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { OrderActionButtons } from '@/components/OrderActionButtons';

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">주문내역</h1>
      <div className="mt-5 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl bg-white p-5 text-sm shadow-sm">
            <div className="flex justify-between gap-3">
              <p className="font-black">{order.orderNo}</p>
              <p className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{order.status}</p>
            </div>
            <div className="mt-3 space-y-1">
              {order.items.map((item) => (
                <p key={item.id}>{item.name} × {item.quantity}</p>
              ))}
            </div>
            <p className="mt-3 text-base font-black text-[#214b36]">{won(order.totalAmount)}</p>
            <OrderActionButtons orderId={order.id} status={order.status} />
          </div>
        ))}
        {!orders.length && <p className="rounded-3xl bg-white p-5 text-sm">아직 주문내역이 없어요.</p>}
      </div>
    </div>
  );
}
EOF

cat > components/OrderActionButtons.tsx <<'EOF'
'use client';

import { useRouter } from 'next/navigation';

export function OrderActionButtons({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();

  async function updateStatus(nextStatus: string) {
    await fetch('/api/orders/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: nextStatus }),
    });
    router.refresh();
  }

  if (status === 'CANCEL_REQUESTED' || status === 'RETURN_REQUESTED' || status === 'CANCELED' || status === 'RETURNED') {
    return null;
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button onClick={() => updateStatus('CANCEL_REQUESTED')} className="rounded-2xl bg-[#f1ead9] py-3 text-xs font-black text-[#5b5141]">
        취소신청
      </button>
      <button onClick={() => updateStatus('RETURN_REQUESTED')} className="rounded-2xl bg-[#f1ead9] py-3 text-xs font-black text-[#5b5141]">
        반품신청
      </button>
    </div>
  );
}
EOF

cat > components/AdminOrderButtons.tsx <<'EOF'
'use client';

import { useRouter } from 'next/navigation';

export function AdminOrderButtons({ orderId }: { orderId: string }) {
  const router = useRouter();

  async function updateStatus(status: string) {
    await fetch('/api/orders/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button onClick={() => updateStatus('CANCELED')} className="rounded-2xl bg-red-50 py-3 text-xs font-black text-red-600">취소승인</button>
      <button onClick={() => updateStatus('RETURNED')} className="rounded-2xl bg-orange-50 py-3 text-xs font-black text-orange-600">반품승인</button>
      <button onClick={() => updateStatus('PAID')} className="rounded-2xl bg-green-50 py-3 text-xs font-black text-green-700">결제완료</button>
      <button onClick={() => updateStatus('READY')} className="rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700">대기처리</button>
    </div>
  );
}
EOF

cat > app/admin/orders/page.tsx <<'EOF'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminOrderButtons } from '@/components/AdminOrderButtons';

export default async function AdminOrdersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/login');

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true, user: true },
  });

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">주문관리</h1>
      <div className="mt-5 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
            <div className="flex justify-between gap-3">
              <p className="font-black">{o.orderNo}</p>
              <p className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{o.status}</p>
            </div>
            <p className="mt-2">{o.buyerName} / {o.buyerPhone}</p>
            <p className="text-[#7a6b4d]">{o.address}</p>
            <div className="mt-3 space-y-1">
              {o.items.map((item) => <p key={item.id}>{item.name} × {item.quantity}</p>)}
            </div>
            <p className="mt-3 text-base font-black text-[#214b36]">{won(o.totalAmount)}</p>
            <AdminOrderButtons orderId={o.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

cat > components/AdminProductCreateForm.tsx <<'EOF'
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminProductCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function submit(formData: FormData) {
    await fetch('/api/admin/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-3xl bg-white p-4">
      <button onClick={() => setOpen(!open)} className="w-full rounded-2xl bg-[#214b36] py-3 font-black text-white">
        상품 등록하기
      </button>
      {open && (
        <form action={submit} className="mt-4 space-y-3">
          <input name="name" placeholder="상품명" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="category" placeholder="카테고리" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="price" type="number" placeholder="판매가" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="stock" type="number" placeholder="재고" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="badge" placeholder="뱃지 예: 산지직송" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <textarea name="description" placeholder="상품 설명" className="min-h-28 w-full rounded-2xl bg-[#fffaf0] p-4" />
          <button className="w-full rounded-2xl bg-[#f5d87a] py-3 font-black text-[#214b36]">저장</button>
        </form>
      )}
    </div>
  );
}
EOF

cat > app/admin/products/page.tsx <<'EOF'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminProductCreateForm } from '@/components/AdminProductCreateForm';

export default async function AdminProductsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/login');

  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="px-5 pt-5">
      <h1 className="mb-5 text-2xl font-black text-[#214b36]">상품관리</h1>
      <AdminProductCreateForm />
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-3xl bg-white p-4 text-sm">
            <p className="font-black">{p.name}</p>
            <p>{p.category} / {won(p.price)} / 재고 {p.stock}</p>
            <p className="mt-2 text-xs text-[#7a6b4d]">{p.isActive ? '판매중' : '숨김'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

cat > fix-current-mvp.sh <<'EOF'
#!/usr/bin/env bash
set -e

# 아이엠농부 모바일 MVP 안정화 패치
# 실행: chmod +x fix-current-mvp.sh && ./fix-current-mvp.sh

mkdir -p app/api/debug/seed app/api/orders/create app/api/orders/status app/api/admin/products/create app/login app/mypage app/products/market components lib prisma

cat > auth.ts <<'AUTH'
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').trim();
        const password = String(credentials?.password || '');

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
AUTH

cat > app/login/page.tsx <<'LOGIN'
import Link from 'next/link';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

async function login(formData: FormData) {
  'use server';

  try {
    await signIn('credentials', {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
      redirectTo: '/mypage',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect('/login?error=CredentialsSignin');
    }
    throw error;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <form action={login} className="px-5 pt-8">
      <h1 className="text-2xl font-black text-[#214b36]">로그인</h1>

      {params.error && (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
          이메일 또는 비밀번호가 맞지 않아요. 관리자 계정은 admin@iamnongbu.local / admin1234! 입니다.
        </div>
      )}

      <div className="mt-5 space-y-3">
        <input name="email" type="email" placeholder="이메일" defaultValue="admin@iamnongbu.local" className="w-full rounded-2xl bg-white p-4" />
        <input name="password" type="password" placeholder="비밀번호" defaultValue="admin1234!" className="w-full rounded-2xl bg-white p-4" />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">로그인</button>
      <Link href="/signup" className="mt-4 block text-center text-sm font-bold text-[#214b36]">아직 회원이 아니신가요?</Link>
    </form>
  );
}
LOGIN

cat > app/api/debug/seed/route.ts <<'SEED'
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const products = [
  {
    name: '프리미엄 제철 사과',
    category: '과일',
    description: '아침마다 선별한 산지직송 제철 사과입니다. 아이엠농부의 기준으로 고른 단단하고 향 좋은 상품이에요.',
    price: 12900,
    image: '/products/apple.jpg',
    badge: '산지직송',
    stock: 100,
  },
  {
    name: '유기농 쌈채소 모음',
    category: '채소',
    description: '가족 식탁에 바로 올리기 좋은 신선 채소 구성입니다. 고기, 생선구이, 반찬과 함께 먹기 좋아요.',
    price: 6900,
    image: '/products/greens.jpg',
    badge: '유기농',
    stock: 80,
  },
  {
    name: '당일 손질 반건조 생선',
    category: '수산물',
    description: '아이엠농부 매장에서 30분 전 예약 후 따뜻하게 받아볼 수 있는 반건조 생선구이용 상품입니다.',
    price: 9900,
    image: '/products/fish.jpg',
    badge: '예약추천',
    stock: 50,
  },
  {
    name: '호박고구마 한입 사이즈',
    category: '간식',
    description: '우녹스 오븐 군고구마용으로 좋은 달콤한 한입 사이즈 호박고구마입니다.',
    price: 7900,
    image: '/products/sweet-potato.jpg',
    badge: '매장인기',
    stock: 70,
  },
];

export async function GET() {
  await prisma.user.upsert({
    where: { email: 'admin@iamnongbu.local' },
    update: {
      password: await bcrypt.hash('admin1234!', 10),
      role: 'ADMIN',
      name: '아이엠농부 관리자',
      phone: '010-2054-1688',
    },
    create: {
      name: '아이엠농부 관리자',
      email: 'admin@iamnongbu.local',
      phone: '010-2054-1688',
      password: await bcrypt.hash('admin1234!', 10),
      role: 'ADMIN',
    },
  });

  for (const product of products) {
    const exists = await prisma.product.findFirst({ where: { name: product.name } });
    if (exists) {
      await prisma.product.update({ where: { id: exists.id }, data: product });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  const count = await prisma.product.count();
  return NextResponse.json({ ok: true, message: 'seed complete', productCount: count });
}
SEED

cat > app/page.tsx <<'HOME'
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Footer } from '@/components/Footer';
import { won } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await prisma.product.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: 'desc' } });

  return (
    <>
      <section className="px-5 pt-5">
        <div className="rounded-[2rem] bg-[#214b36] p-6 text-white shadow-xl shadow-green-900/20">
          <p className="text-sm text-[#d8e6cd]">Real Farmer, Real Freshness</p>
          <h1 className="mt-3 text-3xl font-black leading-tight">농부가 고른<br />오늘의 신선함</h1>
          <p className="mt-3 text-sm leading-6 text-[#edf3e8]">동탄 아이엠농부에서 매일 선별한 과일, 채소, 유기농 상품을 모바일로 편하게 만나보세요.</p>
          <Link href="/products/market" className="mt-5 inline-flex rounded-full bg-[#f5d87a] px-5 py-3 text-sm font-black text-[#214b36]">오늘 상품 보기</Link>
        </div>
      </section>

      <section className="px-5 pt-7">
        <div className="grid grid-cols-3 gap-3 text-center text-sm font-bold text-[#214b36]">
          {['🍎 과일', '🥬 채소', '🐟 수산'].map((x) => <div key={x} className="rounded-2xl bg-white p-3 shadow-sm">{x}</div>)}
        </div>
      </section>

      <section className="px-5 pt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-black text-[#214b36]">추천 상품</h2>
          <Link href="/products/market" className="text-sm font-bold text-[#7a6b4d]">전체보기</Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl bg-white p-5 text-sm leading-6">
            상품 데이터가 아직 없어요. 터미널에서 서버 실행 후 브라우저로 <b>/api/debug/seed</b> 에 한 번 접속해줘.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]">
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#f1ead9] text-4xl">🌿</div>
                <p className="mt-3 line-clamp-2 text-sm font-black">{p.name}</p>
                <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
HOME

cat > app/products/market/page.tsx <<'MARKET'
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ProductList() {
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">오늘의 상품</h1>
      <p className="mt-2 text-sm text-[#7a6b4d]">아이엠농부가 오늘 추천하는 신선상품이에요.</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]">
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-[#f1ead9] text-4xl">🌿</div>
            {p.badge && <p className="mt-3 inline-flex rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">{p.badge}</p>}
            <p className="mt-2 text-sm font-black">{p.name}</p>
            <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
MARKET

cat > components/AddToCartButton.tsx <<'CARTBTN'
'use client';

import { useCart } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AddToCartButton({ product }: { product: { id: string; name: string; price: number; image: string } }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [done, setDone] = useState(false);

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => {
          add(product);
          setDone(true);
        }}
        className="rounded-2xl bg-[#f1ead9] px-5 py-4 text-sm font-black text-[#214b36] active:scale-[.99]"
      >
        {done ? '담겼어요 ✓' : '장바구니 담기'}
      </button>
      <button
        type="button"
        onClick={() => {
          add(product);
          router.push('/cart');
        }}
        className="rounded-2xl bg-[#214b36] px-5 py-4 text-sm font-black text-white active:scale-[.99]"
      >
        바로구매
      </button>
    </div>
  );
}
CARTBTN

cat > app/products/[id]/page.tsx <<'DETAIL'
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AddToCartButton } from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { reviews: { orderBy: { createdAt: 'desc' } } } });
  if (!product) notFound();

  return (
    <div className="px-5 pt-5">
      <div className="flex aspect-square items-center justify-center rounded-[2rem] bg-[#f1ead9] text-7xl">🌿</div>
      {product.badge && <p className="mt-5 inline-flex rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{product.badge}</p>}
      <h1 className="mt-3 text-2xl font-black text-[#1f2a24]">{product.name}</h1>
      <p className="mt-2 text-2xl font-black text-[#214b36]">{won(product.price)}</p>
      <p className="mt-4 rounded-3xl bg-white p-5 text-sm leading-7 text-[#5b5141]">{product.description}</p>
      <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, image: product.image }} />

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">상품 후기</h2>
          <Link href={`/reviews?productId=${product.id}`} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#214b36]">후기쓰기</Link>
        </div>
        <div className="mt-4 space-y-3">
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white p-4 text-sm">
              <p>{'⭐'.repeat(r.rating)}</p>
              <p className="mt-2">{r.content}</p>
            </div>
          ))}
          {!product.reviews.length && <p className="rounded-3xl bg-white p-4 text-sm text-[#7a6b4d]">아직 후기가 없어요.</p>}
        </div>
      </section>
    </div>
  );
}
DETAIL

cat > components/CheckoutClient.tsx <<'CHECKOUT'
'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { useState } from 'react';

export function CheckoutClient() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function pay() {
    try {
      if (!items.length) return alert('장바구니가 비어 있어요.');
      if (!buyerName || !buyerPhone) return alert('이름과 연락처를 입력해줘.');
      setLoading(true);

      const tossOrderId = `IAMNONGBU-${Date.now()}`;
      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, buyerName, buyerPhone, address, tossOrderId }),
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        throw new Error(error.message || '주문 생성 실패');
      }

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' });

      clear();

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: total },
        orderId: tossOrderId,
        orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/fail`,
        customerName: buyerName,
        customerMobilePhone: buyerPhone.replaceAll('-', ''),
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : '결제 준비 중 문제가 생겼어요.');
      setLoading(false);
    }
  }

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">주문/결제</h1>

      <section className="mt-5 rounded-3xl bg-white p-5">
        <h2 className="font-black">주문자 정보</h2>
        <div className="mt-4 space-y-3">
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="이름" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="연락처 010-0000-0000" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="배송지 또는 픽업 요청사항" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5">
        <p className="font-black">주문상품</p>
        <div className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>{item.name} × {item.quantity}</span>
              <span>{won(item.price * item.quantity)}</span>
            </div>
          ))}
          {!items.length && <p className="text-[#7a6b4d]">장바구니가 비어 있어요.</p>}
        </div>
        <div className="mt-5 flex justify-between border-t pt-4 text-lg font-black">
          <span>총액</span><span>{won(total)}</span>
        </div>
      </section>

      <button disabled={loading} onClick={pay} className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-50">
        {loading ? '결제 준비 중...' : '토스페이먼츠 테스트 결제'}
      </button>
    </div>
  );
}
CHECKOUT

cat > app/mypage/page.tsx <<'MYPAGE'
import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const isAdmin = (session.user as any)?.role === 'ADMIN';

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">마이페이지</h1>
      <div className="mt-5 rounded-3xl bg-white p-5">
        <p className="font-black">{session.user?.name}</p>
        <p className="text-sm text-[#7a6b4d]">{session.user?.email}</p>
      </div>
      <div className="mt-4 grid gap-3">
        <Link href="/orders" className="rounded-2xl bg-white p-4 font-bold">주문내역 / 취소신청</Link>
        <Link href="/returns" className="rounded-2xl bg-white p-4 font-bold">반품신청</Link>
        <Link href="/inquiries" className="rounded-2xl bg-white p-4 font-bold">문의게시판</Link>
        {isAdmin && <Link href="/admin" className="rounded-2xl bg-[#214b36] p-4 font-black text-white">관리자 페이지</Link>}
      </div>
      <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
        <button className="mt-5 w-full rounded-2xl bg-[#f1ead9] py-4 font-bold">로그아웃</button>
      </form>
    </div>
  );
}
MYPAGE

cat > app/reviews/page.tsx <<'REVIEWS'
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

async function createReview(formData: FormData) {
  'use server';
  const productId = String(formData.get('productId') || '');
  if (!productId) redirect('/products/market');

  await prisma.review.create({
    data: {
      productId,
      rating: Number(formData.get('rating') || 5),
      content: String(formData.get('content') || ''),
    },
  });
  redirect(`/products/${productId}`);
}

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const params = await searchParams;

  return (
    <form action={createReview} className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">후기 작성</h1>
      <input type="hidden" name="productId" value={params.productId || ''} />
      <select name="rating" className="mt-5 w-full rounded-2xl bg-white p-4">
        <option value="5">★★★★★ 아주 좋아요</option>
        <option value="4">★★★★ 좋아요</option>
        <option value="3">★★★ 보통이에요</option>
      </select>
      <textarea name="content" placeholder="후기를 남겨주세요" className="mt-3 min-h-32 w-full rounded-2xl bg-white p-4" />
      <button className="mt-3 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">등록</button>
    </form>
  );
}
REVIEWS

cat > app/api/orders/create/route.ts <<'ORDERCREATE'
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const { items, buyerName, buyerPhone, address, tossOrderId } = body;

  if (!items?.length) return NextResponse.json({ message: '장바구니가 비어 있어요.' }, { status: 400 });
  if (!buyerName || !buyerPhone) return NextResponse.json({ message: '주문자 정보가 부족해요.' }, { status: 400 });

  const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);
  const orderNo = `IMF-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      tossOrderId,
      userId: (session?.user as any)?.id || null,
      buyerName,
      buyerPhone,
      address,
      totalAmount,
      status: 'READY',
      items: {
        create: items.map((item: any) => ({
          productId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}
ORDERCREATE

cat > .env <<'ENV'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="iamnongbu-local-dev-secret-change-later-123456789"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="iamnongbu-local-dev-secret-change-later-123456789"
AUTH_TRUST_HOST="true"
TOSS_CLIENT_KEY="test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
TOSS_SECRET_KEY="test_gsk_docs_Ovk5rk1EwkEbP0W43n07xlzm"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ENV

cp .env .env.local
pnpm prisma generate
pnpm prisma db push

echo "✅ 안정화 패치 완료"
echo "이제 실행: pnpm dev"
echo "실행 후 브라우저에서 먼저 접속: http://localhost:3000/api/debug/seed"
echo "그 다음 홈: http://localhost:3000"
EOF

echo "pnpm dev"
