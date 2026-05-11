import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-lite';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: '프로덕션에서는 seed API를 사용할 수 없어요.' }, { status: 404 });
  }

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  try {
    await prisma.user.upsert({
      where: { email: 'admin@iamnongbu.local' },
      update: {
        name: '아이엠농부 관리자',
        phone: '010-2054-1688',
        password: await bcrypt.hash('admin1234!', 10),
        role: 'ADMIN',
      },
      create: {
        name: '아이엠농부 관리자',
        email: 'admin@iamnongbu.local',
        phone: '010-2054-1688',
        password: await bcrypt.hash('admin1234!', 10),
        role: 'ADMIN',
      },
    });

    await prisma.product.upsert({
      where: { name: '프리미엄 제철 사과' },
      update: {},
      create: {
        name: '프리미엄 제철 사과',
        category: '과일',
        description: '아침마다 선별한 산지직송 제철 사과입니다.',
        price: 12900,
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=900&auto=format&fit=crop&q=80',
        badge: '산지직송',
        stock: 100,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'seed complete',
      admin: 'admin@iamnongbu.local / admin1234!',
    });
  } catch (error) {
    console.error('SEED_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
      },
      { status: 500 }
    );
  }
}
