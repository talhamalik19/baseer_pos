import PageHead from "@/components/global/PageHead";
import { cookies } from "next/headers";
import {
  getAdminDetail,
  getAvailableStores
} from "@/lib/Magento";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import WorstSellerReport from "@/components/blocks/Reports/WorstSellerReport";

export default async function WorstSellerPage() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const storeCode = cookieStore.get("store_code")?.value || "default";

  const response = await getAdminDetail();
  const user = response?.data?.data;
  const { firstname, lastname } = user;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const stores = await getAvailableStores(jwt);

  const submitWorstSellerReport = async (apiUrl) => {
    "use server";
    const res = await magentoReportRestFetch({
      path: apiUrl,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return res;
  };

  return (
    <ProtectedRoute requiredPermission="sales_process">
      <PageHead
        pageName={serverLanguage?.csvTranslations?.Sales ?? "Worst Seller Report"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <WorstSellerReport
        storeCode={storeCode}
        submitWorstSellerReport={submitWorstSellerReport}
        stores={stores}
      />
    </ProtectedRoute>
  );
}
