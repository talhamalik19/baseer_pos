import PageHead from "@/components/global/PageHead";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import WarehouseStockReport from "@/components/blocks/Reports/WarehouseStockReport";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";

export default async function WarehouseStockStatus() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
  
  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const storeCode = cookieStore.get("store_code")?.value || "default";

  const submitWarehouseStockReport = async (apiUrl) => {
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
        pageName={serverLanguage?.csvTranslations?.warehouse_stock_report ?? "Warehouse Stock Report"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <WarehouseStockReport submitWarehouseStockReport={submitWarehouseStockReport} storeCode={storeCode} />
    </>
  );
}
