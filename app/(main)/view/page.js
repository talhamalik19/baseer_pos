import ViewSelector from "@/components/blocks/view/view";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import PageHead from "@/components/global/PageHead";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";

export default async function View() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  
  const response = await getAdminDetail();
  const user = response;
  const { firstname, lastname } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
    const serverCurrency = await CurrencyProvider()
      const serverLanguage = await LanguageProvider()
  
  
  return (
    <>
      <PageHead pageName={'View'} firstName={firstname} lastName={lastname} initials={initials} serverCurrency={serverCurrency} serverLanguage={serverLanguage}/>
      <ViewSelector />
    </>
  );
}
