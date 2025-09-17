import PageHead from '@/components/global/PageHead';
import { getAdminDetail } from '@/lib/Magento';
import { cookies } from 'next/headers';
import styles from "@/components/blocks/Reports/report.module.scss"
import Suspend from '@/components/blocks/suspend';
import CurrencyProvider from '@/components/global/CurrencyProvider';
import LanguageProvider from '@/components/global/LanguageProvider';

export default async function SuspendedOrders({ params, searchParams }) {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value || null;
      const userResponse = await getAdminDetail();
      const user = userResponse;
      const { firstname, lastname } = user?.data?.data || {};
      const initials = `${firstname?.charAt(0) || ""}${
        lastname?.charAt(0) || ""
      }`.toUpperCase();
        const serverCurrency = await CurrencyProvider()
            const serverLanguage = await LanguageProvider()
        
      

  return (
    <>
   <PageHead
           pageName={serverLanguage?.csvTranslations?.on_hold_orders ?? "On-Hold Orders"}
           firstName={firstname}
           lastName={lastname}
           initials={initials}
           serverCurrency={serverCurrency}
           serverLanguage={serverLanguage}
         />
    <Suspend serverLanguage={serverLanguage?.csvTranslations}/>
    </>
  );
}
