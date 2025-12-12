import OrderDetail from '@/components/blocks/Orders/OrderDetail';
import CurrencyProvider from '@/components/global/CurrencyProvider';
import LanguageProvider from '@/components/global/LanguageProvider';
import PageHead from '@/components/global/PageHead';
import { getAdminDetail, getOrders } from '@/lib/Magento';
import { cookies } from 'next/headers';

export default async function OrderReceipt({ params, searchParams }) {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value || null;
      const userResponse = await getAdminDetail();
      const user = userResponse;
      const adminId = user?.data?.data?.id
      const { firstname, lastname } = user?.data?.data || {};
      const initials = `${firstname?.charAt(0) || ""}${
        lastname?.charAt(0) || ""
      }`.toUpperCase();
  const param = await params;
  const slug = param?.slug;
  const serverCurrency = await CurrencyProvider()
      const serverLanguage = await LanguageProvider()
  

  const order = await getOrders({
        email: "",
        phone: "",
        orderNumber: slug,
        billName: "",
        status: "",
        isPosOrder: null,
        isWebOrder: null, 
        isMobOrder: null,
        posCode: "",
        dateFrom: "",
        dateTo: ""
    })
  return (
    <>
   <PageHead
           pageName={"Order Detail"}
           firstName={firstname}
           lastName={lastname}
           initials={initials}
           serverCurrency={serverCurrency}
           serverLanguage={serverLanguage}
         />
      <OrderDetail orderResponse={order?.data?.[0]} jwt={jwt} adminId={adminId}/>
    </>
  );
}
