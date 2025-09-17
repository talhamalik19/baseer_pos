import PageHead from "@/components/global/PageHead";
import { cookies } from "next/headers";
import { getAdminDetail, getAvailableStores } from "@/lib/Magento";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import SalesPeakHourReport from "@/components/blocks/Reports/PeakHourReport";

export default async function PeakHourReportPage() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const response = await getAdminDetail();
  const user = response?.data?.data;
  const { firstname, lastname } = user;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const stores = await getAvailableStores(jwt);

  const submitPeakHourReport = async (apiUrl) => {
    "use server";
    const res = await magentoReportRestFetch({
      path: apiUrl,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return res?.body;
  };

  return (
    <ProtectedRoute requiredPermission="sales_process">
      <PageHead
        pageName={serverLanguage?.csvTranslations?.Sales ?? "Peak Hour Report"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <SalesPeakHourReport
        submitPeakHourReport={submitPeakHourReport}
        serverLanguage={serverLanguage?.csvTranslations}
        storeCode={storeCode}
        stores={stores}
      />
    </ProtectedRoute>
  );
}