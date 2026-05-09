import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const body = await req.json();
  const productId = String(body.productId || '');
  if (!productId) return NextResponse.json({ message: '상품 ID가 필요해요.' }, { status: 400 });

  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!body.name || !body.category || !body.description) {
    return NextResponse.json({ message: '상품명, 카테고리, 설명을 입력해주세요.' }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ message: '판매가를 확인해주세요.' }, { status: 400 });
  }
  if (!Number.isFinite(stock) || stock < 0) {
    return NextResponse.json({ message: '재고를 확인해주세요.' }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name: String(body.name),
      category: String(body.category),
      description: String(body.description),
      price,
      stock,
      image: body.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop&q=80',
      badge: body.badge ? String(body.badge) : null,
      isFarmerPick: Boolean(body.isFarmerPick),
      sortOrder: Number(body.sortOrder || 0),
    },
  });

  return NextResponse.json(product);
}
