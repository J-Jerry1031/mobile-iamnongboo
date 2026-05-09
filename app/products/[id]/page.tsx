import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductImage } from '@/components/ProductImage';
import {
  BadgeCheck,
  ChevronLeft,
  Clock3,
  Leaf,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Snowflake,
  Star,
  Store,
  Truck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { reviews: { orderBy: { createdAt: 'desc' } } } });
  if (!product) notFound();
  const averageRating = product.reviews.length
  ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
  : 0;

  const deliveryFee = product.price >= 30000 ? 0 : 3000;

  return (
    <div className="pb-44">
      <div className="px-5 pt-3">
        <Link href="/products/market" className="mb-3 inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
          <ChevronLeft size={18} /> 상품 목록
        </Link>
        <ProductImage src={product.image} name={product.name} big />
      </div>

      <section className="px-5 pt-5">
      {product.badge && <p className="inline-flex rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{product.badge}</p>}
      <h1 className="mt-3 text-[26px] font-black leading-tight text-[#1f2a24]">{product.name}</h1>
      {product.reviews.length > 0 && (
  <p className="mt-2 flex items-center gap-1 text-sm font-bold text-[#7a6b4d]">
    <Star size={16} className="fill-[#f5d87a] text-[#f5d87a]" /> {averageRating.toFixed(1)} / 후기 {product.reviews.length}개
  </p>
)}
      <p className="mt-2 text-2xl font-black text-[#214b36]">{won(product.price)}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: '산지직송', icon: Truck },
          { label: '신선보장', icon: BadgeCheck },
          { label: product.stock > 0 ? `재고 ${product.stock}` : '품절임박', icon: PackageCheck },
        ].map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-3 text-center text-[11px] font-black text-[#214b36]">
            <Icon className="mx-auto mb-1 text-[#668f6b]" size={18} />
            {label}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-3xl bg-white p-5 text-sm leading-7 text-[#5b5141]">{product.description}</p>
      </section>

      <nav className="mx-5 mt-5 grid grid-cols-3 rounded-2xl bg-white p-1 text-center text-sm font-black text-[#214b36] shadow-sm">
        <a href="#product-info" className="rounded-xl px-2 py-3 active:bg-[#e5f0dc]">상품정보</a>
        <a href="#delivery-info" className="rounded-xl px-2 py-3 active:bg-[#e5f0dc]">배송/교환</a>
        <a href="#review-info" className="rounded-xl px-2 py-3 active:bg-[#e5f0dc]">후기</a>
      </nav>

      <section id="product-info" className="mx-5 mt-4 rounded-3xl bg-white p-5 shadow-sm scroll-mt-28">
        <h2 className="flex items-center gap-2 text-lg font-black text-[#1f2a24]">
          <Leaf size={20} className="text-[#668f6b]" /> 상품정보
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ['카테고리', product.category],
            ['원산지', '국내 산지'],
            ['보관방법', product.category === '수산물' ? '냉동/냉장 보관' : '냉장 보관 권장'],
            ['출고상태', product.stock > 0 ? '주문 가능' : '품절 임박'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#fcfbf6] p-4">
              <p className="text-xs font-bold text-[#7a6b4d]">{label}</p>
              <p className="mt-2 font-black text-[#1f2a24]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-[#e5f0dc] p-4 text-sm leading-6 text-[#214b36]">
          아이엠농부는 상품 입고 상태를 확인한 뒤 포장하며, 신선도 이상이 확인되면 출고 전 연락드립니다.
        </div>
      </section>

      <section id="delivery-info" className="mx-5 mt-4 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce] scroll-mt-28">
        <h2 className="text-lg font-black text-[#1f2a24]">배송 · 보관 안내</h2>
        <div className="mt-4 space-y-3 text-sm text-[#5b5141]">
          <p className="flex items-center gap-3">
            <Truck className="text-[#668f6b]" size={20} />
            14시 이전 주문 시 당일 출고를 우선으로 준비합니다.
          </p>
          <p className="flex items-center gap-3">
            <Snowflake className="text-[#668f6b]" size={20} />
            신선식품은 수령 후 바로 냉장 보관해주세요.
          </p>
          <p className="flex items-center gap-3">
            <ShieldCheck className="text-[#668f6b]" size={20} />
            상품 이상 시 수령 당일 사진과 함께 문의해주세요.
          </p>
          <p className="flex items-center gap-3">
            <Store className="text-[#668f6b]" size={20} />
            매장 픽업 선택 시 준비 완료 후 안내드립니다.
          </p>
        </div>
        <div className="mt-4 flex justify-between border-t border-[#eadfce] pt-4 text-sm font-black">
          <span>배송비</span>
          <span className="text-[#214b36]">{deliveryFee ? won(deliveryFee) : '무료배송'}</span>
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-[#1f2a24]">
          <RotateCcw size={20} className="text-[#668f6b]" /> 교환 · 환불 기준
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#5b5141]">
          <p>신선식품 특성상 단순 변심 반품은 어렵지만, 상품 이상은 확인 후 교환 또는 환불로 책임집니다.</p>
          <p>수령 당일 상품 사진과 주문번호를 함께 남겨주시면 가장 빠르게 도와드릴 수 있어요.</p>
        </div>
      </section>

      <section id="review-info" className="mt-8 px-5 scroll-mt-28">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">상품 후기</h2>
          <Link href={`/reviews?productId=${product.id}`} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#214b36]">후기쓰기</Link>
        </div>
        <div className="mt-4 space-y-3">
          {product.reviews.map((r) => <div key={r.id} className="rounded-3xl bg-white p-4 text-sm"><p>{'⭐'.repeat(r.rating)}</p><p className="mt-2">{r.content}</p></div>)}
          {!product.reviews.length && <p className="rounded-3xl bg-white p-4 text-sm text-[#7a6b4d]">아직 후기가 없어요.</p>}
        </div>
      </section>

      <section className="mx-5 mt-5 rounded-3xl bg-[#214b36] p-5 text-white">
        <p className="flex items-center gap-2 text-sm font-black text-[#f5d87a]">
          <Clock3 size={17} /> 오늘 주문 전 확인
        </p>
        <p className="mt-3 text-sm leading-6 text-white/80">
          신선식품은 재고와 입고 상태에 따라 출고 일정이 달라질 수 있어요. 품질이 맞지 않으면 출고 전 연락드립니다.
        </p>
      </section>

      <AddToCartButton sticky product={{ id: product.id, name: product.name, price: product.price, image: product.image }} />
    </div>
  );
}
