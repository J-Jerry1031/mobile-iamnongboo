import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Leaf,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

const featureBadges = [
  { label: '전국 산지 직송', icon: Truck },
  { label: '엄선된 품질', icon: BadgeCheck },
  { label: '100% 리콜', icon: ShieldCheck },
];

const ecoBadges = [
  { label: '자연 친화적', icon: Leaf },
  { label: '신선함', icon: Sparkles },
  { label: '건강', icon: Recycle },
];

const storyItems = [
  {
    title: '유기농 농산물',
    copy: '진짜 농부가 선택한 신선한 농산물을 만나보세요',
    note: '홈에서 다양한 유기농 제품을 확인하실 수 있습니다',
    image: '/story/organic.jpg',
    href: '/products/market?category=%EC%9C%A0%EA%B8%B0%EB%86%8D',
  },
  {
    title: '신선한 해산물',
    copy: '싱싱하고 맛있는 다양한 해산물을 만나보세요',
    note: '반건조 해산물도 준비되어 있습니다',
    image: '/story/seafood.jpg',
    href: '/products/market?category=%EC%88%98%EC%82%B0%EB%AC%BC',
  },
  {
    title: '브랜드 협업',
    copy: '다양한 브랜드와의 협업 제품을 만나보세요',
    note: '알림 설정하고 실시간 협업 상품을 확인해보세요',
    image: '/story/collab.jpg',
    href: '/products/market',
  },
];

const storeServices = [
  {
    title: '우녹스 오븐',
    copy: '최고급 오븐으로 갓 구운 고구마와 반건조 생선 구이를 만나보세요',
    note: '매장에서만 예약제로 운영됩니다',
    image: '/story/oven.jpg',
  },
  {
    title: '생과일 주스',
    copy: '첨가물 없는 신선한 과일을 담아서 만들어드립니다',
    note: '직접 선택하신 과일로 매장에서 즉시 갈아드립니다',
    image: '/story/juice.jpg',
  },
];

export default function InquiriesPage() {
  return (
    <div className="story-page bg-white">
      <section className="story-hero">
        <img src="/story/story-hero.jpg" alt="채소 바구니를 들고 있는 농부" />
      </section>

      <section className="story-intro">
        <h1>
          자연의 시간을 담아
          <br />
          소중하게 전달합니다
        </h1>
        <p>진짜 농부의 눈으로 고르고, 정직한 마음으로 담습니다.</p>
        <Link href="/" className="story-primary-button">
          홈 바로가기 <ArrowRight size={18} />
        </Link>
      </section>

      <section className="story-landscape">
        <img src="/story/field-landscape.jpg" alt="" />
        <div>
          <h2>
            자연과 함께하는
            <br />
            아이엠 농부
          </h2>
          <p>흙, 햇살, 바람 그리고 우리의 이야기</p>
        </div>
      </section>

      <section className="story-split story-split-right">
        <div className="story-split-image">
          <img src="/story/store-full.jpg" alt="아이엠농부 매장 내부" />
        </div>
        <div className="story-split-copy">
          <h2>
            진짜 농부의
            <br />
            정직한 매장
          </h2>
          <p>
            전국 각지의 농부들과 직접 연결하여 믿을 수 있는 농산물과
            먹거리를 전합니다.
          </p>
          <p>
            모든 상품은 100% 리콜 보장으로 안심하고 구매하실 수 있습니다.
          </p>
          <div className="story-badges">
            {featureBadges.map(({ label, icon: Icon }) => (
              <span key={label}>
                <Icon size={18} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="story-split story-split-left">
        <div className="story-split-copy">
          <h2>
            자연을 담은
            <br />
            친환경 매장
          </h2>
          <p>
            자연과 사람이 함께 숨 쉬는 공간, 건강한 삶의 가치를 지향합니다.
          </p>
          <div className="story-badges">
            {ecoBadges.map(({ label, icon: Icon }) => (
              <span key={label}>
                <Icon size={18} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="story-split-image">
          <img src="/story/store-full.jpg" alt="아이엠농부 친환경 매장" />
        </div>
      </section>

      <section className="story-premium">
        <h2>
          Premium
          <br />
          Food &amp; Life
        </h2>
        <p>편안한 마음과 행복을 드립니다</p>
      </section>

      <section className="story-products" aria-label="아이엠농부 상품 이야기">
        {storyItems.map((item, index) => (
          <article
            key={item.title}
            className={index % 2 === 0 ? 'story-item' : 'story-item reverse'}
          >
            <Link href={item.href} className="story-item-image">
              <img src={item.image} alt={item.title} />
            </Link>
            <div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <small>{item.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="story-store">
        <h2>
          자연의 맛 그대로
          <br />
          매장에서 즐기는 건강함
        </h2>
        <p>아이엠 농부에서 건강한 에너지를 충전하세요</p>

        <div className="story-service-list">
          {storeServices.map((service, index) => (
            <article
              key={service.title}
              className={index % 2 === 0 ? 'story-service' : 'story-service reverse'}
            >
              <img src={service.image} alt={service.title} />
              <div>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <small>{service.note}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
