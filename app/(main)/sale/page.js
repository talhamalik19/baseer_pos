import PageHead from "@/components/global/PageHead";
import { getAdminDetail, getProducts, getCategories } from "@/lib/Magento";
import { cookies } from "next/headers";
import SalesDetail from "@/components/blocks/Sales";
import SyncHandler from "@/components/SyncHandler";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister/ServiceWorkerRegister";
import macaddress from "macaddress";
// import { loadPosData } from "@/lib/posStorage";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";

let macAddress;
macaddress.one((err, mac) => {
  if (err) throw err;
  macAddress = mac;
});

export default async function Sales() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const pos_code = cookieStore.get("pos_code")?.value || null
  let ordersResponse;
  // const data = await loadPosData();

  const response = await getAdminDetail();
  const user = response;
  const { firstname, lastname, username, email } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""
    }`.toUpperCase();

  const serverCurrency = await CurrencyProvider();
  const currencySymbol = cookieStore.get("currency_symbol")?.value;
  const currency = cookieStore.get("currency_code")?.value;
  const serverLanguage = await LanguageProvider();
  const warehouseId = cookieStore?.get("warehouse_id")?.value || ""
  const products = await getProducts({ id: "", pos_code: pos_code, currency: currency });
  const categories = await getCategories();
  // ordersResponse = await getOrders();

  return (
    <>
      <ProtectedRoute requiredPermission="sales_process">
        <PageHead
          pageName={serverLanguage?.csvTranslations?.Sales ?? "Sales"}
          firstName={firstname}
          lastName={lastname}
          initials={initials}
          serverCurrency={serverCurrency}
          serverLanguage={serverLanguage}

        />
        <SalesDetail
          jwt={jwt}
          productItems={products}
          ordersResponse={[]}
          macAddress={macAddress}
          username={username}
          currencySymbol={currencySymbol}
          currency={currency}
          serverLanguage={serverLanguage?.csvTranslations}
          warehouseId={warehouseId}
          categories={categories}
        />
        <SyncHandler />
        <ServiceWorkerRegister />
      </ProtectedRoute>
    </>
  );
}
