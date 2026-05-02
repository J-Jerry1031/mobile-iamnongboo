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
