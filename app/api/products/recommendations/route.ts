import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: [{ isFarmerPick: 'desc' }, { createdAt: 'desc' }],
    take: 6,
    select: {
      id: true,
      name: true,
      price: true,
      image: true,
      badge: true,
      stock: true,
    },
  });

  return NextResponse.json({ products });
}
