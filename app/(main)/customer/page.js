import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getCustomers } from "@/lib/Magento";
import { cookies } from "next/headers";
import CustomerListing from "@/components/blocks/Customer";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";

export default async function Customer() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const response = await getAdminDetail();
  const user = response;
  const { firstname, lastname } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
  const res = await getCustomers("", 10, 1);
  const total_count = res?.total_count;
  const serverCurrency = await CurrencyProvider()
      const serverLanguage = await LanguageProvider()
  
  return (
    <>
      <PageHead pageName={serverLanguage?.csvTranslations?.customer ?? 'Customer'} firstName={firstname} lastName={lastname} initials={initials}  serverCurrency={serverCurrency} serverLanguage={serverLanguage}/>
      <CustomerListing jwt={jwt} customer={res} total_count={total_count} serverLanguage={serverLanguage?.csvTranslations}/>
    </>
  );
}