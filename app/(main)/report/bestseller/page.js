import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getAvailableStores } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import SalesReport from "@/components/blocks/Reports/SalesReport";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import InvoiceReport from "@/components/blocks/Reports/InvoiceReport";
import CustomerReport from "@/components/blocks/Reports/CustomerReport";
import BestsellerReport from "@/components/blocks/Reports/BestsellerReport";

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
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const stores = await getAvailableStores(jwt);

  const submitBestSellerReport = async (apiUrl) => {
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
          serverLanguage?.csvTranslations?.bestseller_report ?? "Bestseller Report"
        }
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <BestsellerReport
        submitBestSellerReport={submitBestSellerReport}
        storeCode={storeCode}
        stores={stores}
      />
    </>
  );
}
