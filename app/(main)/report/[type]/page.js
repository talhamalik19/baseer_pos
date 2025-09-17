import PageHead from "@/components/global/PageHead";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";
import styles from "@/components/blocks/Reports/report.module.scss";
import ReportDetail from "@/components/blocks/Reports/ReportDetail";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";

export default async function Reports({ params, searchParams }) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${
    lastname?.charAt(0) || ""
  }`.toUpperCase();
  const type = await params;
  const filter = type.type

    const serverCurrency = await CurrencyProvider()
        const serverLanguage = await LanguageProvider()
    
  

  return (
    <>
      <PageHead
        pageName={serverLanguage?.csvTranslations?.report_summary ?? "Report Summary"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
  <ReportDetail type={filter} serverLanguage={serverLanguage?.csvTranslations} storeCode={storeCode}/>
    </>
  );
}
