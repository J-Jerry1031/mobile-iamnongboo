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
