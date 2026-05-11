import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, MapPin } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { AddressBookManager } from '@/components/AddressBookManager';

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/mypage/addresses&reason=protected');

  const addresses = await prisma.deliveryAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="px-5 pb-10 pt-5">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={17} /> 마이페이지
      </Link>
      <div className="mt-4 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADDRESS BOOK</p>
        <h1 className="mt-2 text-2xl font-black">배송지 관리</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          자주 쓰는 배송지를 저장하고 결제할 때 바로 선택해요.
        </p>
      </div>
      <p className="mt-4 flex gap-2 rounded-2xl bg-[#e5f0dc] p-4 text-xs font-bold leading-5 text-[#214b36]">
        <MapPin size={16} className="mt-0.5 shrink-0" />
        주소 검색은 카카오 주소 검색 화면으로 열리고, 상세주소는 아이엠농부에 저장됩니다.
      </p>
      <div className="mt-4">
        <AddressBookManager initialAddresses={addresses} userName={user.name} userPhone={user.phone || ''} />
      </div>
    </div>
  );
}
