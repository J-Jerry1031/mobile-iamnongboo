import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductImage } from '@/components/ProductImage';
import { RestockAlertForm } from '@/components/RestockAlertForm';
import { ReviewHelpfulButton } from '@/components/ReviewHelpfulButton';
import {
  BadgeCheck,
  ChevronLeft,
  Clock3,
  Leaf,
  PackageCheck,
  Refrigerator,
  RotateCcw,
  ShieldCheck,
  Snowflake,
  Star,
  Store,
  Truck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { title: '상품을 찾을 수 없어요 | 아이엠농부' };

  return {
    title: `${product.name} | 아이엠농부`,
    description: product.description,
    openGraph: {
      title: `${product.name} | 아이엠농부`,
      description: product.description,
      images: [{ url: product.image, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | 아이엠농부`,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!product) notFound();
  const averageRating = product.reviews.length
  ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
  : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: product.reviews.filter((review) => review.rating === rating).length,
  }));

  const deliveryFee = product.price >= 30000 ? 0 : 3000;
  const couponPrice = Math.max(0, product.price - 3000);
  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 1);
  const expectedDelivery = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(expectedDeliveryDate);
  const producerNote = product.category === '수산물'
    ? '입고일 기준 선도와 냉장/냉동 상태를 확인한 상품만 판매합니다.'
    : '국내 산지와 협력해 당일 상태가 좋은 상품을 우선 선별합니다.';
  const storageNote = product.category === '수산물'
    ? '수령 즉시 냉장 또는 냉동 보관하고, 해동 후 재냉동은 피해주세요.'
    : product.category === '과일'
      ? '직사광선을 피하고, 상품 상태에 따라 냉장 보관하면 더 오래 즐길 수 있어요.'
      : '수령 후 밀봉해 냉장 보관하고 가능한 빠르게 드시는 것을 권장합니다.';
  const productInfoRows = [
    ['카테고리', product.category],
    ['원산지', product.origin || '국내 산지'],
    ['중량/용량', product.weight || '상품별 상세 표기'],
    ['보관방법', product.storage || (product.category === '수산물' ? '냉동/냉장 보관' : '냉장 보관 권장')],
    ['소비기한', product.expiration || '수령 후 빠른 섭취 권장'],
    ['알레르기/주의사항', product.allergy || '상세 설명 및 포장 라벨 확인'],
    ['출고상태', product.stock > 0 && product.isActive ? '주문 가능' : '품절'],
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image, product.detailImage].filter(Boolean),
    description: product.description,
    brand: { '@type': 'Brand', name: '아이엠농부' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'KRW',
      availability: product.stock > 0 && product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/products/${product.id}`,
    },
    ...(product.reviews.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(averageRating.toFixed(1)),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="pb-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="px-5 pt-3">
        <Link href="/products/market" className="mb-3 inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
          <ChevronLeft size={18} /> 상품 목록
        </Link>
        <ProductImage src={product.image} name={product.name} big />
      </div>

      <section className="px-5 pt-5">
        <div className="flex flex-wrap gap-2">
          {product.badge && <p className="inline-flex rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{product.badge}</p>}
          <p className="inline-flex rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#668f6b]">WELCOME3000 쿠폰</p>
        </div>
        <h1 className="mt-3 text-[25px] font-black leading-[1.24] text-[#1f2a24]">{product.name}</h1>
        <a href="#review-info" className="mt-2 flex items-center gap-1 text-sm font-bold text-[#7a6b4d]">
          <Star size={16} className="fill-[#f5d87a] text-[#f5d87a]" />
          {product.reviews.length ? `${averageRating.toFixed(1)} / 후기 ${product.reviews.length}개` : '첫 후기를 기다려요'}
        </a>

        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#7a6b4d]">쿠폰 적용가</p>
              <p className="mt-1 text-[28px] font-black leading-none text-[#214b36]">{won(couponPrice)}</p>
              <p className="mt-2 text-sm font-bold text-[#9b8d73] line-through">{won(product.price)}</p>
            </div>
            <span className="rounded-2xl bg-[#e5f0dc] px-3 py-2 text-xs font-black text-[#214b36]">
              최대 {won(3000)} 할인
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-[#5b5141]">
            <div className="rounded-2xl bg-[#fcfbf6] p-3">
              <p className="text-[#7a6b4d]">예상 수령</p>
              <p className="mt-1 font-black text-[#1f2a24]">{expectedDelivery} 준비</p>
            </div>
            <div className="rounded-2xl bg-[#fcfbf6] p-3">
              <p className="text-[#7a6b4d]">배송비</p>
              <p className="mt-1 font-black text-[#1f2a24]">{deliveryFee ? `${won(deliveryFee)} · 3만원 무료` : '무료배송'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: '산지직송', icon: Truck },
            { label: '신선보장', icon: BadgeCheck },
            { label: product.stock > 0 && product.isActive ? `재고 ${product.stock}` : '품절', icon: PackageCheck },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white p-3 text-center text-[11px] font-black text-[#214b36]">
              <Icon className="mx-auto mb-1 text-[#668f6b]" size={18} />
              {label}
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-3xl bg-white p-5 text-[14px] leading-[1.7] text-[#5b5141]">{product.description}</p>
        {(!product.isActive || product.stock <= 0) && <RestockAlertForm productId={product.id} />}
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
          {productInfoRows.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#fcfbf6] p-4">
              <p className="text-xs font-bold text-[#7a6b4d]">{label}</p>
              <p className="mt-2 font-black text-[#1f2a24]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-[#e5f0dc] p-4 text-sm leading-6 text-[#214b36]">
          아이엠농부는 상품 입고 상태를 확인한 뒤 포장하며, 신선도 이상이 확인되면 출고 전 연락드립니다.
        </div>
        {(product.detailImage || product.image) && (
          <img
            src={product.detailImage || product.image}
            alt={`${product.name} 상세 이미지`}
            className="mt-4 w-full rounded-2xl object-cover"
          />
        )}
      </section>

      <section className="mx-5 mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-[#1f2a24]">
          <ShieldCheck size={20} className="text-[#668f6b]" /> 믿고 구매하는 기준
        </h2>
        <div className="mt-4 grid gap-3">
          {[
            { title: '산지/입고 확인', body: producerNote, icon: Leaf },
            { title: '보관 방법', body: storageNote, icon: Refrigerator },
            { title: '문제 상품 보상', body: '상품 이상은 수령 당일 사진과 주문번호를 남겨주시면 확인 후 교환 또는 환불로 도와드려요.', icon: RotateCcw },
          ].map(({ title, body, icon: Icon }) => (
            <div key={title} className="flex gap-3 rounded-2xl bg-[#fcfbf6] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
                <Icon size={19} />
              </span>
              <span>
                <span className="block font-black text-[#1f2a24]">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#5b5141]">{body}</span>
              </span>
            </div>
          ))}
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

      <section className="mx-5 mt-4 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
        <h2 className="text-lg font-black text-[#1f2a24]">자주 묻는 질문</h2>
        <div className="mt-4 space-y-3 text-sm">
          {[
            ['언제 받을 수 있나요?', '상품과 입고 상태에 따라 다르지만, 주문 확인 후 가능한 빠르게 픽업/배송 준비를 진행합니다.'],
            ['상품 상태가 좋지 않으면 어떻게 하나요?', '수령 당일 사진과 함께 문의해주시면 상태 확인 후 교환 또는 환불로 책임집니다.'],
            ['품절이면 다시 입고되나요?', '산지 상황에 따라 재입고 일정이 달라질 수 있어요. 문의를 남겨주시면 확인해드릴게요.'],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-2xl bg-white p-4">
              <p className="font-black text-[#214b36]">Q. {question}</p>
              <p className="mt-2 leading-6 text-[#5b5141]">A. {answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="review-info" className="mt-8 px-5 scroll-mt-28">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">상품 후기</h2>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#7a6b4d]">구매 후 작성</span>
        </div>
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[28px] font-black text-[#214b36]">{product.reviews.length ? averageRating.toFixed(1) : '0.0'}</p>
              <p className="mt-1 text-xs font-bold text-[#7a6b4d]">후기 {product.reviews.length}개</p>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {ratingCounts.map((item) => (
                <div key={item.rating} className="flex items-center gap-2 text-[11px] font-bold text-[#7a6b4d]">
                  <span className="w-8">별 {item.rating}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1ead9]">
                    <span className="block h-full rounded-full bg-[#668f6b]" style={{ width: `${product.reviews.length ? Math.round((item.count / product.reviews.length) * 100) : 0}%` }} />
                  </span>
                  <span className="w-5 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white p-4 text-sm leading-6">
              <div className="flex items-center justify-between gap-3">
                <p>{'⭐'.repeat(r.rating)}</p>
                <p className="text-xs font-bold text-[#7a6b4d]">{r.user?.name || '구매 고객'}</p>
              </div>
              {r.photoUrl && <img src={r.photoUrl} alt="후기 사진" className="mt-3 aspect-square w-28 rounded-2xl object-cover" />}
              <p className="mt-2">{r.content}</p>
              <ReviewHelpfulButton reviewId={r.id} initialCount={r.helpfulCount} />
            </div>
          ))}
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

      <AddToCartButton sticky product={{ id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock, isActive: product.isActive }} />
    </div>
  );
}
