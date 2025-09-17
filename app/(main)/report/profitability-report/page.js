import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getAvailableStores } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import ProfitabilityReport from "@/components/blocks/Reports/ProfitabilityReport";

export default async function ProfitabilityReports() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const userResponse = await getAdminDetail();
  const { firstname, lastname } = userResponse?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const stores = await getAvailableStores(jwt);

  const submitProfitabilityReport = async (apiUrl) => {
    "use server";
    const res = await magentoReportRestFetch({
      path: apiUrl,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return res;
  };

  return (
    <>
      <PageHead
        pageName={
          serverLanguage?.csvTranslations?.profitability_report ?? "Profitability Report"
        }
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <ProfitabilityReport
        submitProfitabilityReport={submitProfitabilityReport}
        storeCode={storeCode}
        stores={stores}
      />
    </>
  );
}
