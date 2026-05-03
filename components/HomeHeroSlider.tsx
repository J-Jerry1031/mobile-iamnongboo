'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
};

export function HomeHeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[index];

  return (
    <section className="px-5 pt-5">
      <Link
        href={slide.href}
        className="relative block overflow-hidden rounded-[2rem] bg-[#214b36] shadow-xl shadow-green-900/20"
      >
        <img
          src={slide.image}
          alt={slide.title}
          className="h-[320px] w-full object-cover opacity-75"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <p className="text-sm font-bold text-[#f5d87a]">
            Real Farmer, Real Freshness
          </p>

          <h1 className="mt-2 text-3xl font-black leading-tight">
            {slide.title}
          </h1>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/90">
            {slide.subtitle}
          </p>

          <span className="mt-5 inline-flex rounded-full bg-[#f5d87a] px-5 py-3 text-sm font-black text-[#214b36]">
            바로 보기
          </span>
        </div>
      </Link>

      <div className="mt-3 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-[#214b36]' : 'w-2 bg-[#d8ccb8]'
            }`}
            aria-label={`${s.title} 슬라이드 보기`}
          />
        ))}
      </div>
    </section>
  );
}
