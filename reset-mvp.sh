#!/usr/bin/env bash
set -e

echo "🌱 아이엠농부 모바일 쇼핑몰 MVP 원샷 재구성 시작"

# 0) 폴더 생성
mkdir -p app/{api/login,api/logout,api/debug/seed,api/orders/create,api/orders/status,api/admin/products/create,api/admin/products/toggle,products/market,products/[id],cart,checkout,checkout/success,checkout/fail,login,signup,mypage,orders,inquiries,reviews,admin,admin/orders,admin/members,admin/products}
mkdir -p components lib prisma

# 1) 환경변수
cat > .env <<'EOF'
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
TOSS_SECRET_KEY="test_gsk_docs_Ovk5rk1EwkEbP0W43n07xlzm"
EOF
cp .env .env.local

# 2) 패키지 설치
pnpm add prisma@6.19.1 @prisma/client@6.19.1 lucide-react zustand @tosspayments/tosspayments-sdk bcryptjs
pnpm add -D @types/bcryptjs

# 3) Prisma 스키마
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
  name        String   @unique
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

# 4) 기본 lib
cat > lib/prisma.ts <<'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF

cat > lib/format.ts <<'EOF'
export const won = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';
EOF

cat > lib/auth-lite.ts <<'EOF'
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('imf_user_id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}
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
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  setQty: (id: string, quantity: number) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const exists = state.items.find((x) => x.id === item.id);
          if (exists) {
            return { items: state.items.map((x) => x.id === item.id ? { ...x, quantity: x.quantity + quantity } : x) };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((x) => x.id !== id) })),
      clear: () => set({ items: [] }),
      inc: (id) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: x.quantity + 1 } : x) })),
      dec: (id) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x) })),
      setQty: (id, quantity) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: Math.max(1, quantity) } : x) })),
    }),
    { name: 'iamnongbu-cart' }
  )
);
EOF

# 5) 스타일
cat > app/globals.css <<'EOF'
@import "tailwindcss";

:root {
  --farm-green: #214b36;
  --farm-deep: #183528;
  --farm-cream: #fffaf0;
  --farm-paper: #f1ead9;
}

* { box-sizing: border-box; }
body { background: #e9e2d3; color: #1f2a24; }
a { -webkit-tap-highlight-color: transparent; }
.mobile-shell {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--farm-cream);
  box-shadow: 0 0 40px rgba(0,0,0,.08);
}
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

# 6) 공통 컴포넌트
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
          <Link href="/cart"><ShoppingBag size={23} /></Link>
        </nav>
      </div>
    </header>
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

cat > components/ProductImage.tsx <<'EOF'
export function ProductImage({ src, name, big = false }: { src: string; name: string; big?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-[#f1ead9] ${big ? 'aspect-square' : 'aspect-square'}`}>
      <img src={src} alt={name} className="h-full w-full object-cover" />
    </div>
  );
}
EOF

cat > components/AddToCartButton.tsx <<'EOF'
'use client';

import { useCart } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AddToCartButton({ product }: { product: { id: string; name: string; price: number; image: string } }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3">
        <span className="text-sm font-black text-[#214b36]">수량</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="h-9 w-9 rounded-full bg-[#f1ead9] font-black">-</button>
          <span className="w-8 text-center font-black">{qty}</span>
          <button type="button" onClick={() => setQty(qty + 1)} className="h-9 w-9 rounded-full bg-[#f1ead9] font-black">+</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { add(product, qty); setDone(true); }}
          className="rounded-2xl bg-[#f1ead9] px-5 py-4 text-sm font-black text-[#214b36] active:scale-[.99]"
        >
          {done ? '담겼어요 ✓' : '장바구니'}
        </button>
        <button
          type="button"
          onClick={() => { add(product, qty); router.push('/cart'); }}
          className="rounded-2xl bg-[#214b36] px-5 py-4 text-sm font-black text-white active:scale-[.99]"
        >
          바로구매
        </button>
      </div>
    </div>
  );
}
EOF

# 7) API
cat > app/api/login/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: String(email || '').trim() } });
  if (!user) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const ok = await bcrypt.compare(String(password || ''), user.password);
  if (!ok) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set('imf_user_id', user.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}
EOF

cat > app/api/logout/route.ts <<'EOF'
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('imf_user_id', '', { path: '/', maxAge: 0 });
  return res;
}
EOF

cat > app/api/debug/seed/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const products = [
  { name: '프리미엄 제철 사과', category: '과일', description: '아침마다 선별한 산지직송 제철 사과입니다. 단단하고 향 좋은 상품만 고릅니다.', price: 12900, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=900&auto=format&fit=crop&q=80', badge: '산지직송', stock: 100 },
  { name: '유기농 쌈채소 모음', category: '채소', description: '가족 식탁에 바로 올리기 좋은 신선 채소 구성입니다.', price: 6900, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&auto=format&fit=crop&q=80', badge: '유기농', stock: 80 },
  { name: '반건조 생선구이 세트', category: '수산물', description: '아이엠농부 매장에서 30분 전 예약 후 따뜻하게 받아볼 수 있는 생선구이용 상품입니다.', price: 9900, image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=900&auto=format&fit=crop&q=80', badge: '예약추천', stock: 50 },
  { name: '호박고구마 한입 사이즈', category: '간식', description: '우녹스 오븐 군고구마용으로 좋은 달콤한 한입 사이즈 호박고구마입니다.', price: 7900, image: 'https://images.unsplash.com/photo-1596097557993-54ee7a0d5d22?w=900&auto=format&fit=crop&q=80', badge: '매장인기', stock: 70 },
  { name: '성수동 꾸덕 요거트', category: '유제품', description: '아이엠농부에서 만나는 성수동 스타일의 꾸덕한 요거트입니다.', price: 3900, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900&auto=format&fit=crop&q=80', badge: '콜라보', stock: 60 },
  { name: '생과일 주스 키트', category: '음료', description: '진짜 과일 100% 느낌을 살린 아이엠농부 생과일 주스용 구성입니다.', price: 5900, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=900&auto=format&fit=crop&q=80', badge: '신선음료', stock: 40 },
  { name: '프리미엄 토마토', category: '채소', description: '샐러드와 도시락에 잘 어울리는 당도 좋은 토마토입니다.', price: 8900, image: 'https://images.unsplash.com/photo-1546470427-e5ac89fd931a?w=900&auto=format&fit=crop&q=80', badge: '추천', stock: 90 },
  { name: '오늘의 반찬 3종', category: '반찬', description: '식탁에 바로 올리는 아이엠농부 추천 반찬 구성입니다.', price: 9900, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=900&auto=format&fit=crop&q=80', badge: '3종세트', stock: 30 }
];

export async function GET() {
  await prisma.user.upsert({
    where: { email: 'admin@iamnongbu.local' },
    update: { name: '아이엠농부 관리자', phone: '010-2054-1688', password: await bcrypt.hash('admin1234!', 10), role: 'ADMIN' },
    create: { name: '아이엠농부 관리자', email: 'admin@iamnongbu.local', phone: '010-2054-1688', password: await bcrypt.hash('admin1234!', 10), role: 'ADMIN' }
  });

  await prisma.user.upsert({
    where: { email: 'test@iamnongbu.local' },
    update: { name: '테스트 고객', phone: '010-1111-2222', password: await bcrypt.hash('test1234!', 10), role: 'USER' },
    create: { name: '테스트 고객', email: 'test@iamnongbu.local', phone: '010-1111-2222', password: await bcrypt.hash('test1234!', 10), role: 'USER' }
  });

  for (const product of products) {
    await prisma.product.upsert({ where: { name: product.name }, update: product, create: product });
  }

  return NextResponse.json({ ok: true, message: 'seed complete', admin: 'admin@iamnongbu.local / admin1234!', user: 'test@iamnongbu.local / test1234!', productCount: await prisma.product.count() });
}
EOF

cat > app/api/orders/create/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const user = await getCurrentUser();
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
      userId: user?.id || null,
      buyerName,
      buyerPhone,
      address,
      totalAmount,
      status: 'READY',
      items: { create: items.map((item: any) => ({ productId: item.id, name: item.name, price: Number(item.price), quantity: Number(item.quantity) })) },
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}
EOF

cat > app/api/orders/status/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const { orderId, status } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ message: '주문을 찾을 수 없어요.' }, { status: 404 });

  const isAdmin = user.role === 'ADMIN';
  const isOwner = order.userId === user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ message: '권한이 없어요.' }, { status: 403 });

  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
  return NextResponse.json(updated);
}
EOF

cat > app/api/admin/products/create/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description,
      price: Number(body.price),
      stock: Number(body.stock || 100),
      image: body.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop&q=80',
      badge: body.badge || null,
      isActive: true,
    },
  });

  return NextResponse.json(product);
}
EOF

cat > app/api/admin/products/toggle/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });
  const { productId, isActive } = await req.json();
  const product = await prisma.product.update({ where: { id: productId }, data: { isActive } });
  return NextResponse.json(product);
}
EOF

cat > app/api/toss/confirm/route.ts <<'EOF'
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { paymentKey, orderId, amount } = await req.json();

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ message: '결제 승인 정보가 부족해요.' }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encryptedSecretKey = Buffer.from(secretKey + ':').toString('base64');

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: `Basic ${encryptedSecretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await response.json();

  if (response.ok) {
    await prisma.order.updateMany({ where: { tossOrderId: orderId }, data: { status: 'PAID', paymentKey } });
  }

  return NextResponse.json(data, { status: response.status });
}
EOF

# 8) 페이지
cat > app/page.tsx <<'EOF'
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Footer } from '@/components/Footer';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await prisma.product.findMany({ where: { isActive: true }, take: 8, orderBy: { createdAt: 'desc' } });

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
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-[#214b36]">
          {['🍎 과일', '🥬 채소', '🐟 수산', '🍠 간식'].map((x) => <div key={x} className="rounded-2xl bg-white p-3 shadow-sm">{x}</div>)}
        </div>
      </section>

      <section className="px-5 pt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-black text-[#214b36]">추천 상품</h2>
          <Link href="/products/market" className="text-sm font-bold text-[#7a6b4d]">전체보기</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]">
              <ProductImage src={p.image} name={p.name} />
              {p.badge && <p className="mt-3 inline-flex rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">{p.badge}</p>}
              <p className="mt-2 line-clamp-2 text-sm font-black">{p.name}</p>
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

cat > app/products/market/page.tsx <<'EOF'
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';

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
            <ProductImage src={p.image} name={p.name} />
            {p.badge && <p className="mt-3 inline-flex rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">{p.badge}</p>}
            <p className="mt-2 text-sm font-black">{p.name}</p>
            <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
EOF

cat > app/products/[id]/page.tsx <<'EOF'
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductImage } from '@/components/ProductImage';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { reviews: { orderBy: { createdAt: 'desc' } } } });
  if (!product) notFound();

  return (
    <div className="px-5 pt-5">
      <ProductImage src={product.image} name={product.name} big />
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
          {product.reviews.map((r) => <div key={r.id} className="rounded-3xl bg-white p-4 text-sm"><p>{'⭐'.repeat(r.rating)}</p><p className="mt-2">{r.content}</p></div>)}
          {!product.reviews.length && <p className="rounded-3xl bg-white p-4 text-sm text-[#7a6b4d]">아직 후기가 없어요.</p>}
        </div>
      </section>
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
  const { items, inc, dec, remove, setQty } = useCart();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">장바구니</h1>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
            <div className="flex-1">
              <p className="font-black">{item.name}</p>
              <p className="text-sm font-bold text-[#214b36]">{won(item.price)}</p>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => dec(item.id)} className="rounded-full bg-[#f1ead9] px-3 py-1">-</button>
                <input value={item.quantity} onChange={(e) => setQty(item.id, Number(e.target.value || 1))} className="w-10 rounded-lg bg-[#fffaf0] text-center" />
                <button onClick={() => inc(item.id)} className="rounded-full bg-[#f1ead9] px-3 py-1">+</button>
                <button onClick={() => remove(item.id)} className="ml-auto text-xs text-red-500">삭제</button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <p className="rounded-3xl bg-white p-5 text-sm text-[#7a6b4d]">장바구니가 비어 있어요.</p>}
      </div>
      <div className="mt-6 rounded-3xl bg-[#214b36] p-5 text-white">
        <div className="flex justify-between text-lg font-black"><span>총 결제금액</span><span>{won(total)}</span></div>
        <Link href="/checkout" className="mt-4 block rounded-2xl bg-[#f5d87a] py-4 text-center font-black text-[#214b36]">주문하기</Link>
      </div>
    </div>
  );
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
  const clear = useCart((s) => s.clear);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [address, setAddress] = useState('매장 픽업');
  const [loading, setLoading] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function pay() {
    try {
      if (!items.length) return alert('장바구니가 비어 있어요.');
      if (!buyerName || !buyerPhone) return alert('이름과 연락처를 입력해줘.');
      setLoading(true);
      const tossOrderId = `IAMNONGBU-${Date.now()}`;
      const createRes = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, buyerName, buyerPhone, address, tossOrderId }) });
      if (!createRes.ok) throw new Error((await createRes.json()).message || '주문 생성 실패');

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' });
      clear();
      await payment.requestPayment({ method: 'CARD', amount: { currency: 'KRW', value: total }, orderId: tossOrderId, orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`, successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`, failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/fail`, customerName: buyerName, customerMobilePhone: buyerPhone.replaceAll('-', '') });
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
        <div className="mt-3 space-y-2 text-sm">{items.map((item) => <div key={item.id} className="flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><span>{won(item.price * item.quantity)}</span></div>)}</div>
        <div className="mt-5 flex justify-between border-t pt-4 text-lg font-black"><span>총액</span><span>{won(total)}</span></div>
      </section>
      <button disabled={loading} onClick={pay} className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-50">{loading ? '결제 준비 중...' : '토스페이먼츠 테스트 결제'}</button>
    </div>
  );
}
EOF

cat > app/checkout/page.tsx <<'EOF'
import { CheckoutClient } from '@/components/CheckoutClient';
export default function CheckoutPage() { return <CheckoutClient />; }
EOF

cat > app/checkout/success/page.tsx <<'EOF'
import Link from 'next/link';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> }) {
  const params = await searchParams;
  let data: any = { message: '결제 정보가 없습니다.' };
  if (params.paymentKey && params.orderId && params.amount) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/toss/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentKey: params.paymentKey, orderId: params.orderId, amount: Number(params.amount) }), cache: 'no-store' });
    data = await res.json();
  }
  return <div className="px-5 pt-10 text-center"><div className="text-5xl">✅</div><h1 className="mt-4 text-2xl font-black text-[#214b36]">결제 테스트 완료</h1><p className="mt-3 rounded-3xl bg-white p-4 text-left text-xs break-all">{JSON.stringify(data, null, 2)}</p><Link href="/orders" className="mt-5 inline-block rounded-2xl bg-[#214b36] px-5 py-3 font-black text-white">주문내역 보기</Link></div>;
}
EOF

cat > app/checkout/fail/page.tsx <<'EOF'
import Link from 'next/link';
export default async function FailPage({ searchParams }: { searchParams: Promise<{ code?: string; message?: string }> }) { const p = await searchParams; return <div className="px-5 pt-10 text-center"><div className="text-5xl">🥲</div><h1 className="mt-4 text-2xl font-black text-[#214b36]">결제가 취소/실패됐어요</h1><p className="mt-3 text-sm">{p.message || p.code}</p><Link href="/cart" className="mt-5 inline-block rounded-2xl bg-[#214b36] px-5 py-3 font-black text-white">장바구니로</Link></div>; }
EOF

cat > app/login/page.tsx <<'EOF'
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('type') === 'user' ? 'test@iamnongbu.local' : 'admin@iamnongbu.local');
  const [password, setPassword] = useState(searchParams.get('type') === 'user' ? 'test1234!' : 'admin1234!');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) { setError((await res.json()).message || '로그인 실패'); return; }
    router.push('/mypage');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="px-5 pt-8">
      <h1 className="text-2xl font-black text-[#214b36]">로그인</h1>
      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}
      <div className="mt-5 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="이메일" className="w-full rounded-2xl bg-white p-4" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="비밀번호" className="w-full rounded-2xl bg-white p-4" />
      </div>
      <button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">로그인</button>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-[#214b36]"><Link href="/login?type=user" className="rounded-2xl bg-white p-3">고객 테스트</Link><Link href="/signup" className="rounded-2xl bg-white p-3">회원가입</Link></div>
    </form>
  );
}
EOF

cat > app/signup/page.tsx <<'EOF'
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@iamnongbu.local', password: 'test1234!' }) });
    if (!res.ok) { setError('현재 MVP에서는 테스트 고객 계정으로 로그인해줘.'); return; }
    router.push('/mypage');
    router.refresh();
  }

  return <form onSubmit={submit} className="px-5 pt-8"><h1 className="text-2xl font-black text-[#214b36]">회원가입</h1>{error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}<p className="mt-5 rounded-3xl bg-white p-5 text-sm leading-6">MVP에서는 고객 테스트 계정으로 바로 로그인됩니다. 실제 회원가입 DB 저장은 다음 단계에서 확장하면 됩니다.</p><button className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">테스트 고객으로 시작</button></form>;
}
EOF

cat > app/mypage/page.tsx <<'EOF'
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
EOF

cat > components/LogoutButton.tsx <<'EOF'
'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton() { const router = useRouter(); return <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); router.push('/'); router.refresh(); }} className="mt-5 w-full rounded-2xl bg-[#f1ead9] py-4 font-bold">로그아웃</button>; }
EOF

cat > components/OrderActionButtons.tsx <<'EOF'
'use client';
import { useRouter } from 'next/navigation';
export function OrderActionButtons({ orderId, status }: { orderId: string; status: string }) { const router = useRouter(); async function updateStatus(nextStatus: string) { await fetch('/api/orders/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status: nextStatus }) }); router.refresh(); } if (['CANCEL_REQUESTED','RETURN_REQUESTED','CANCELED','RETURNED'].includes(status)) return null; return <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => updateStatus('CANCEL_REQUESTED')} className="rounded-2xl bg-[#f1ead9] py-3 text-xs font-black text-[#5b5141]">취소신청</button><button onClick={() => updateStatus('RETURN_REQUESTED')} className="rounded-2xl bg-[#f1ead9] py-3 text-xs font-black text-[#5b5141]">반품신청</button></div>; }
EOF

cat > app/orders/page.tsx <<'EOF'
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { OrderActionButtons } from '@/components/OrderActionButtons';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const orders = await prisma.order.findMany({ where: user.role === 'ADMIN' ? {} : { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { items: true } });
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">주문내역</h1><div className="mt-5 space-y-4">{orders.map((order) => <div key={order.id} className="rounded-3xl bg-white p-5 text-sm shadow-sm"><div className="flex justify-between gap-3"><p className="font-black">{order.orderNo}</p><p className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{order.status}</p></div><div className="mt-3 space-y-1">{order.items.map((item) => <p key={item.id}>{item.name} × {item.quantity}</p>)}</div><p className="mt-3 text-base font-black text-[#214b36]">{won(order.totalAmount)}</p><OrderActionButtons orderId={order.id} status={order.status} /></div>)}{!orders.length && <p className="rounded-3xl bg-white p-5 text-sm">아직 주문내역이 없어요.</p>}</div></div>;
}
EOF

cat > app/inquiries/page.tsx <<'EOF'
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';

async function createInquiry(formData: FormData) { 'use server'; const user = await getCurrentUser(); await prisma.inquiry.create({ data: { userId: user?.id || null, title: String(formData.get('title')), content: String(formData.get('content')) } }); redirect('/inquiries'); }
export const dynamic = 'force-dynamic';
export default async function InquiriesPage() { const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true } }); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">문의게시판</h1><form action={createInquiry} className="mt-5 space-y-3 rounded-3xl bg-white p-4"><input name="title" placeholder="문의 제목" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><textarea name="content" placeholder="문의 내용" className="min-h-28 w-full rounded-2xl bg-[#fffaf0] p-4" /><button className="w-full rounded-2xl bg-[#214b36] py-3 font-black text-white">문의 남기기</button></form><div className="mt-5 space-y-3">{inquiries.map(i => <div key={i.id} className="rounded-3xl bg-white p-4"><p className="font-black">{i.title}</p><p className="mt-2 text-sm">{i.content}</p><p className="mt-2 text-xs text-[#7a6b4d]">{i.status}</p></div>)}</div></div>; }
EOF

cat > app/reviews/page.tsx <<'EOF'
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
async function createReview(formData: FormData) { 'use server'; const productId = String(formData.get('productId') || ''); const user = await getCurrentUser(); if (!productId) redirect('/products/market'); await prisma.review.create({ data: { productId, userId: user?.id || null, rating: Number(formData.get('rating') || 5), content: String(formData.get('content') || '') } }); redirect(`/products/${productId}`); }
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) { const params = await searchParams; return <form action={createReview} className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">후기 작성</h1><input type="hidden" name="productId" value={params.productId || ''} /><select name="rating" className="mt-5 w-full rounded-2xl bg-white p-4"><option value="5">★★★★★ 아주 좋아요</option><option value="4">★★★★ 좋아요</option><option value="3">★★★ 보통이에요</option></select><textarea name="content" placeholder="후기를 남겨주세요" className="mt-3 min-h-32 w-full rounded-2xl bg-white p-4" /><button className="mt-3 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">등록</button></form>; }
EOF

cat > app/admin/page.tsx <<'EOF'
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
export const dynamic = 'force-dynamic';
export default async function AdminPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">아이엠농부 Admin</h1><div className="mt-5 grid gap-3"><Link href="/admin/orders" className="rounded-2xl bg-white p-4 font-bold">주문관리</Link><Link href="/admin/members" className="rounded-2xl bg-white p-4 font-bold">회원관리</Link><Link href="/admin/products" className="rounded-2xl bg-white p-4 font-bold">상품관리</Link></div></div>; }
EOF

cat > components/AdminOrderButtons.tsx <<'EOF'
'use client';
import { useRouter } from 'next/navigation';
export function AdminOrderButtons({ orderId }: { orderId: string }) { const router = useRouter(); async function updateStatus(status: string) { await fetch('/api/orders/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) }); router.refresh(); } return <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => updateStatus('CANCELED')} className="rounded-2xl bg-red-50 py-3 text-xs font-black text-red-600">취소승인</button><button onClick={() => updateStatus('RETURNED')} className="rounded-2xl bg-orange-50 py-3 text-xs font-black text-orange-600">반품승인</button><button onClick={() => updateStatus('PAID')} className="rounded-2xl bg-green-50 py-3 text-xs font-black text-green-700">결제완료</button><button onClick={() => updateStatus('READY')} className="rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700">대기처리</button></div>; }
EOF

cat > app/admin/orders/page.tsx <<'EOF'
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminOrderButtons } from '@/components/AdminOrderButtons';
export const dynamic = 'force-dynamic';
export default async function AdminOrdersPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true, user: true } }); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">주문관리</h1><div className="mt-5 space-y-4">{orders.map((o) => <div key={o.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm"><div className="flex justify-between gap-3"><p className="font-black">{o.orderNo}</p><p className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{o.status}</p></div><p className="mt-2">{o.buyerName} / {o.buyerPhone}</p><p className="text-[#7a6b4d]">{o.address}</p><div className="mt-3 space-y-1">{o.items.map((item) => <p key={item.id}>{item.name} × {item.quantity}</p>)}</div><p className="mt-3 text-base font-black text-[#214b36]">{won(o.totalAmount)}</p><AdminOrderButtons orderId={o.id} /></div>)}{!orders.length && <p className="rounded-3xl bg-white p-5 text-sm">주문이 아직 없어요.</p>}</div></div>; }
EOF

cat > app/admin/members/page.tsx <<'EOF'
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export default async function AdminMembersPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } }); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">회원관리</h1><div className="mt-5 space-y-3">{users.map(u => <div key={u.id} className="rounded-3xl bg-white p-4 text-sm"><p className="font-black">{u.name}</p><p>{u.email}</p><p>{u.phone}</p><p>{u.role}</p></div>)}</div></div>; }
EOF

cat > components/AdminProductCreateForm.tsx <<'EOF'
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function AdminProductCreateForm() { const router = useRouter(); const [open, setOpen] = useState(false); async function submit(formData: FormData) { await fetch('/api/admin/products/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData)) }); setOpen(false); router.refresh(); } return <div className="mb-5 rounded-3xl bg-white p-4"><button onClick={() => setOpen(!open)} className="w-full rounded-2xl bg-[#214b36] py-3 font-black text-white">상품 등록하기</button>{open && <form action={submit} className="mt-4 space-y-3"><input name="name" placeholder="상품명" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><input name="category" placeholder="카테고리" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><input name="price" type="number" placeholder="판매가" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><input name="stock" type="number" placeholder="재고" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><input name="badge" placeholder="뱃지 예: 산지직송" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><input name="image" placeholder="이미지 URL" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><textarea name="description" placeholder="상품 설명" className="min-h-28 w-full rounded-2xl bg-[#fffaf0] p-4" /><button className="w-full rounded-2xl bg-[#f5d87a] py-3 font-black text-[#214b36]">저장</button></form>}</div>; }
EOF

cat > components/ProductToggleButton.tsx <<'EOF'
'use client';
import { useRouter } from 'next/navigation';
export function ProductToggleButton({ productId, isActive }: { productId: string; isActive: boolean }) { const router = useRouter(); return <button onClick={async () => { await fetch('/api/admin/products/toggle', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, isActive: !isActive }) }); router.refresh(); }} className="mt-3 rounded-2xl bg-[#f1ead9] px-4 py-2 text-xs font-black text-[#214b36]">{isActive ? '판매 숨김' : '판매 재개'}</button>; }
EOF

cat > app/admin/products/page.tsx <<'EOF'
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminProductCreateForm } from '@/components/AdminProductCreateForm';
import { ProductToggleButton } from '@/components/ProductToggleButton';
export const dynamic = 'force-dynamic';
export default async function AdminProductsPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } }); return <div className="px-5 pt-5"><h1 className="mb-5 text-2xl font-black text-[#214b36]">상품관리</h1><AdminProductCreateForm /><div className="space-y-3">{products.map((p) => <div key={p.id} className="rounded-3xl bg-white p-4 text-sm"><div className="flex gap-3"><img src={p.image} alt={p.name} className="h-16 w-16 rounded-2xl object-cover" /><div><p className="font-black">{p.name}</p><p>{p.category} / {won(p.price)} / 재고 {p.stock}</p><p className="mt-1 text-xs text-[#7a6b4d]">{p.isActive ? '판매중' : '숨김'}</p></div></div><ProductToggleButton productId={p.id} isActive={p.isActive} /></div>)}</div></div>; }
EOF

# 9) DB 초기화/생성
rm -f prisma/dev.db dev.db
pnpm prisma generate
pnpm prisma db push

# 10) Next 캐시 제거
rm -rf .next

echo "✅ 완료"
echo "1) pnpm dev"
echo "2) 브라우저: http://localhost:3000/api/debug/seed"
echo "3) 홈: http://localhost:3000"
echo "관리자: admin@iamnongbu.local / admin1234!"
echo "고객: test@iamnongbu.local / test1234!"
