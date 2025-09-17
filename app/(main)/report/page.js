import PageHead from "@/components/global/PageHead";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import Reports from "@/components/blocks/Reports";

export default async function Report({ params, searchParams }) {
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
        pageName={serverLanguage?.csvTranslations?.report ?? "Report"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <Reports serverLanguage={serverLanguage?.csvTranslations}/>
    </>
  );
}
