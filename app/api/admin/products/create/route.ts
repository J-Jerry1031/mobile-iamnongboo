import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { asRecord, safeInt, safeOptionalText, safeProductCategory, safeText, safeUrl } from '@/lib/security';

const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop&q=80';

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const body = asRecord(await req.json());
  const name = safeText(body.name, 80);
  const category = safeProductCategory(body.category);
  const description = safeText(body.description, 1000);
  if (!name || !category || !description) {
    return NextResponse.json({ message: '상품명, 카테고리, 설명을 입력해주세요.' }, { status: 400 });
  }

  const price = safeInt(body.price, -1, 0, 10_000_000);
  const stock = safeInt(body.stock || 100, 100, 0, 100_000);
  const sortOrder = safeInt(body.sortOrder || 0, 0, -100_000, 100_000);
  if (price < 0) {
    return NextResponse.json({ message: '판매가를 확인해주세요.' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      description,
      price,
      stock,
      image: safeUrl(body.image, fallbackImage),
      badge: safeOptionalText(body.badge, 30),
      isFarmerPick: Boolean(body.isFarmerPick),
      sortOrder,
      isActive: true,
    },
  });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: 'PRODUCT_CREATE',
      targetType: 'PRODUCT',
      targetId: product.id,
      summary: `${product.name} 상품 등록`,
    },
  });

  return NextResponse.json(product);
}
