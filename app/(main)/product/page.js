import Categories from "@/components/blocks/Catalog/Categories";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import PageHead from "@/components/global/PageHead";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister/ServiceWorkerRegister";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import SyncHandler from "@/components/SyncHandler";
import { getAdminDetail, getCategories, getOrders, getProducts } from "@/lib/Magento";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const currencySymbol = cookieStore.get("currency_symbol")?.value;
  const currency = cookieStore.get("currency_code")?.value;
  
  const category = await getCategories();
  let ordersResponse;
  
  const response = await getAdminDetail();
  const user = response;
  const products = await getProducts({id:"", sort: '', currency: currency});
  console.log("====", products)
  const productItems = products?.items?.filter((item) => 
    item?.stock_status === "IN_STOCK") || [];
  const { firstname, lastname } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
    const serverCurrency = await CurrencyProvider();
        const serverLanguage = await LanguageProvider()
    
  // ordersResponse = await getOsrders();
  return (
    <>
      <ProtectedRoute requiredPermission="catalog_manage" >
      <Categories 
        category={category} 
        productItems={productItems} 
        jwt={jwt} 
        ordersResponse={[]} 
        firstName={firstname} 
        lastName={lastname} 
        initials={initials}
        currencySymbol = {currencySymbol}
        currency={currency}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <SyncHandler />
      <ServiceWorkerRegister />
      </ProtectedRoute>
    </>
  );
}