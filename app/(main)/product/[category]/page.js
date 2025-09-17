// app/product/[category]/page.js
import { notFound } from "next/navigation";
import CategoriesComponent from "@/components/blocks/Catalog/Categories";
import { getAdminDetail, getCategories, getProducts } from "@/lib/Magento"; // Ensure getProducts supports categoryId
import { cookies } from "next/headers";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";

export default async function CategoryPage({ params }) {
  const { category: categorySlug } = params; // Renamed to categorySlug for clarity

  const cookieStore = cookies(); // No need for await here if used directly
  const jwt = cookieStore.get("jwt")?.value || null;
  const currencySymbol = cookieStore.get("currency_symbol")?.value;
  const currency = cookieStore.get("currency_code")?.value;

  // --- Step 1: Fetch Categories and Admin Detail Concurrently ---
  // We need categories first to find the currentCategory and its ID.
  const [adminResponse, categoryResponse] = await Promise.all([
    getAdminDetail(), // Fetches admin user details
    getCategories(),   // Fetches all categories from Magento API
  ]);

  const user = adminResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();

  const allMagentoCategories = [];
  // Flatten the category tree from the Magento API response
  // This logic is crucial for easily finding categories by url_key or id,
  // and for establishing parent-child relationships.
  categoryResponse?.data?.forEach(parentCategory => {
    if (parentCategory?.children) {
      parentCategory.children.forEach(childCategory => {
        allMagentoCategories.push({
          id: childCategory.id,
          name: childCategory.name,
          level: childCategory.level,
          path: childCategory.path,
          uid: childCategory.uid,
          url_key: childCategory.url_key,
          url_path: childCategory.url_path,
          parent_id: parentCategory.id // Important for hierarchy
        });
        if (childCategory.children) {
          childCategory.children.forEach(grandChild => {
            allMagentoCategories.push({
              id: grandChild.id,
              name: grandChild.name,
              level: grandChild.level,
              path: grandChild.path,
              uid: grandChild.uid,
              url_key: grandChild.url_key,
              url_path: grandChild.url_path,
              parent_id: childCategory.id // Important for hierarchy
            });
          });
        }
      });
    }
  });

  // Find the current category object based on the URL slug (url_key or id)
  const currentCategory = allMagentoCategories.find(
    (cat) => cat.url_key === categorySlug || String(cat.id) === categorySlug // Match by url_key or id (ensure id is string for comparison)
  );

  // If the category slug doesn't match any known category and it's not "all",
  // render a 404 Not Found page.
  if (!currentCategory && categorySlug !== "all") {
    notFound();
  }

  // --- Step 2: Fetch Products based on the identified category ---
  let productsResponse;
  if (currentCategory) {
    // If a specific category is found, fetch products *only* for that category ID
    // This is the optimization: Magento API should filter at the source.
    productsResponse = await getProducts({ categoryId: currentCategory.id, sort: '', currency: currency });
  } else {
    // If the slug is "all" or no specific category matched (but didn't 404),
    // fetch all products (as in the Home page).
    productsResponse = await getProducts({ id: "", sort: '', currency: currency });
  }

  // Filter products by stock status (this happens after the API fetch, as needed)
  const productItems = productsResponse?.items?.filter((item) =>
    item?.stock_status === "IN_STOCK") || [];

  // Determine the initial selected category for the client-side component's state
  const initialSelectedItem = currentCategory || { name: "All Items", id: "", level: 0 };

  // Fetch server-side currency and language details (if they contain dynamic data)
  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();

  return (
    <div className="category-page">
      {/* The main Catalog/Categories component */}
      <CategoriesComponent
        // Pass the full category structure, as the client component still uses it for IndexedDB
        category={{ data: categoryResponse?.data }}
        // Pass the already filtered (by category and stock) product items
        productItems={productItems}
        jwt={jwt}
        ordersResponse={[]} // Placeholder, as per your original code
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        currencySymbol={currencySymbol}
        currency={currency}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
        initialSelectedItem={initialSelectedItem} // Crucial for pre-selecting the category
        hideCategoryNavigation={true} // New prop to hide the top category navigation
      />
    </div>
  );
}