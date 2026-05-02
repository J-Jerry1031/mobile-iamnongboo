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
