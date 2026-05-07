import Link from "next/link";

type Props = {
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  }>;
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { paymentKey, orderId, amount } = await searchParams;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold">결제 승인 실패</h1>
        <pre className="mt-4 rounded-xl bg-gray-100 p-4">
          {JSON.stringify(data, null, 2)}
        </pre>
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">결제가 완료되었습니다 🎉</h1>
      <p className="mt-4">주문번호: {orderId}</p>
      <p>결제금액: {Number(amount).toLocaleString()}원</p>

      <Link href="/" className="mt-6 inline-block text-green-700 underline">
        홈으로 돌아가기
      </Link>
    </main>
  );
}