import OrderDetail from '@/components/blocks/Orders/OrderDetail';
import PageHead from '@/components/global/PageHead';
import { getAllOrders } from '@/lib/indexedDB';
import { getOrders } from '@/lib/Magento';
import { cookies } from 'next/headers';

export default async function OrderReceipt({ params, searchParams }) {
  //   const cookieStore = await cookies();
  //   const jwt = cookieStore.get("jwt")?.value || null;

  // const order = await getAllOrders()
  return (
    <>
      <PageHead />
      {/* <OrderDetail orderResponse={order?.data?.[0]} jwt={jwt}/> */}
    </>
  );
}
