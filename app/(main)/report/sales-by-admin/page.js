import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getAvailableStores, getEmployees } from "@/lib/Magento";
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import SalesByAdminReport from "@/components/blocks/Reports/SalesByAdminReport";

export default async function SalesByAdminPage() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
    const warehouseId = cookieStore.get("warehouse_id")?.value || null
  const employeesResult = await getEmployees(warehouseId);
  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname, username } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
const storeCode = cookieStore.get("store_code")?.value ||"default"
  const stores = await getAvailableStores(jwt);
  const storeIds = cookieStore?.get("store_id")?.value;

  const adminUser = username || firstname || "admin";

  const submitSalesAdminReport = async (apiUrl) => {
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
          serverLanguage?.csvTranslations?.sales_by_admin_report ??
          "Sales By Staff Report"
        }
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />

      <SalesByAdminReport
        submitSalesAdminReport={submitSalesAdminReport}
        storeCode={storeCode}
  stores={stores}
  storeIds={storeIds}
        adminUser={adminUser}
        employeesResult={employeesResult?.data}
        username={username}
      />
    </>
  );
}
