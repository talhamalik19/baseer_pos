import PageHead from "@/components/global/PageHead";
import { cookies } from "next/headers";
import {
  getAdminDetail,
  getProducts,
  getAvailableStores
} from "@/lib/Magento";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import SalesByItem from "@/components/blocks/Reports/SalesByItem";

export default async function SalesItemsPage() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const currency = cookieStore.get("currency_code")?.value;

  const response = await getAdminDetail();
  const user = response?.data?.data;
  const { firstname, lastname } = user;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const stores = await getAvailableStores(jwt);
  const productsRes = await getProducts({ id: "", sort: "", currency });
  const products = productsRes?.items || [];
  const submitSalesByItemReport = async (apiUrl) => {
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
        pageName={serverLanguage?.csvTranslations?.Sales ?? "Sales by Item"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <SalesByItem
        storeCode={storeCode}
        submitSalesByItemReport={submitSalesByItemReport}
        products={products}
        stores={stores}
      />
    </ProtectedRoute>
  );
}
