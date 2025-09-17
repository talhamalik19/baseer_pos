// File: /app/sales-category/page.js
import PageHead from "@/components/global/PageHead";
import { cookies } from "next/headers";
import { getAdminDetail, getProducts, getCategories, getAvailableStores } from "@/lib/Magento";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { magentoReportRestFetch } from "@/lib/Magento/ReportsUrl";
import SalesByCategory from "@/components/blocks/Reports/SalesBycategory";

function extractAllCategories(categoryList) {
  const categories = [];

  function traverse(children) {
    if (!children) return;

    children.forEach((category) => {
      categories.push({
        id: category?.uid,
        name: category?.name,
        level: category?.level,
      });

      if (category.children && category.children.length > 0) {
        traverse(category.children);
      }
    });
  }

  categoryList.forEach((entry) => {
    traverse(entry.children);
  });

  return categories;
}

export default async function SalesCategoryPage() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const response = await getAdminDetail();
  const user = response?.data?.data;
  const { firstname, lastname } = user;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const products = await getProducts({ id: "" });
  const categoriesData = await getCategories();
  const categories = extractAllCategories(categoriesData?.data || []);
  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();
  const currencySymbol = cookieStore.get("currency_symbol")?.value;
  const currency = cookieStore.get("currency_code")?.value;
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const stores = await getAvailableStores(jwt);

  const submitSalesByCategoryReport = async (apiUrl) => {
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
        pageName={serverLanguage?.csvTranslations?.Sales ?? "Sales by Category"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <SalesByCategory
        jwt={jwt}
        currencySymbol={currencySymbol}
        currency={currency}
        serverLanguage={serverLanguage?.csvTranslations}
        categories={categories}
        storeCode={storeCode}
        stores={stores}
        submitSalesByCategoryReport={submitSalesByCategoryReport}
      />
    </ProtectedRoute>
  );
}
