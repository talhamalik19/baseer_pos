// app/report/sales-transaction-detail-report/page.js
import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getAvailableStores } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import SalesTransactionDetailReport from "@/components/blocks/Reports/SalesTransactionDetailReport";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";

export default async function SalesTransactionDetailReportPage() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const stores = await getAvailableStores(jwt);

  const submitSalesTransactionReport = async (apiUrl) => {
    "use server";
    return await magentoReportRestFetch({
      path: apiUrl,
      headers: { Authorization: `Bearer ${jwt}` },
    });
  };

  return (
    <>
      <PageHead
        pageName={serverLanguage?.csvTranslations?.sales_transaction_detail_report ?? "Sales Transaction Detail Report"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <SalesTransactionDetailReport
        submitSalesTransactionReport={submitSalesTransactionReport}
        storeCode={storeCode}
        stores={stores}
      />
    </>
  );
}