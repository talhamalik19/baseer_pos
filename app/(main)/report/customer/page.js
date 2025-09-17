import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getAvailableStores } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import SalesReport from "@/components/blocks/Reports/SalesReport";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import InvoiceReport from "@/components/blocks/Reports/InvoiceReport";
import CustomerReport from "@/components/blocks/Reports/CustomerReport";

export default async function SalesReports() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${
    lastname?.charAt(0) || ""
  }`.toUpperCase();
  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const storeCode = cookieStore.get("store_code")?.value ||"default"
  const stores = await getAvailableStores(jwt);

  const submitCustomerReport = async (apiUrl) => {
    "use server";
    const res = await magentoReportRestFetch({
      path: apiUrl,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return res;
  };
  const storeIds = cookieStore?.get("store_id")?.value;
  return (
    <>
      <PageHead
        pageName={
          serverLanguage?.csvTranslations?.customer_report ?? "Customer Report"
        }
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
<CustomerReport
  submitCustomerReport={submitCustomerReport}
  storeCode={storeCode}
  stores={stores}
  storeIds={storeIds}
/>
    </>
  );
}
