import PageHead from "@/components/global/PageHead";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import WarehouseTurnoverReport from "@/components/blocks/Reports/WarehouseTurnoverReport";

export default async function WarehouseTurnoverPage() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const storeCode = cookieStore.get("store_code")?.value || "default";

  const submitWarehouseTurnoverReport = async (apiUrl) => {
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
        pageName={serverLanguage?.csvTranslations?.warehouse_turnover_report ?? "Warehouse Turnover Report"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <WarehouseTurnoverReport
        submitWarehouseTurnoverReport={submitWarehouseTurnoverReport}
        storeCode={storeCode}
      />
    </>
  );
}
