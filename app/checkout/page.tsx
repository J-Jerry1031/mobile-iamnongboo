import { CheckoutClient } from '@/components/CheckoutClient';
import { getCurrentUser } from '@/lib/auth-lite';
import { redirect } from 'next/navigation';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/checkout&reason=protected');

  return <CheckoutClient />;
}
