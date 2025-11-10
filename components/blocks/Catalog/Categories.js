"use client";

import React, { useState, useEffect, useCallback } from "react";
import style from "./catalog.module.scss";
import Products from "./Products";
import {
  getProducts as getIDBProducts,
  saveProducts,
  getCategories as getIDBCategories,
  saveCategories,
  addToCart,
  clearAllProducts,
  clearCategories,
} from "@/lib/indexedDB";
import PageHead from "@/components/global/PageHead";
import { fetchProductsAction as fetchMagentoProducts, getCategoriesAction as fetchMagentoCategories } from "@/lib/Magento/actions";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import Search from "@/components/shared/Search";

// Helper function to normalize categories
const normalizeCategories = (categories) => {
  if (!categories) return [];

  const allCategories = [];
  const parentCategories = [];

  categories.forEach((parentCategory) => {
    if (parentCategory?.children) {
      parentCategories.push({
        id: parentCategory.id,
        name: parentCategory.name,
        level: parentCategory.level,
      });

      parentCategory.children.forEach((childCategory) => {
        allCategories.push({
          id: childCategory.id,
          name: childCategory.name,
          level: childCategory.level,
          parent_id: parentCategory.id,
        });

        if (childCategory.children) {
          childCategory.children.forEach((grandChild) => {
            allCategories.push({
              id: grandChild.id,
              name: grandChild.name,
              level: grandChild.level,
              parent_id: childCategory.id,
            });
          });
        }
      });
    }
  });

  return { allCategories, parentCategories };
};

export default function Categories({
  category,
  productItems,
  firstName,
  lastName,
  initials,
  currencySymbol,
  currency,
  serverCurrency,
  serverLanguage,
}) {
  const language = serverLanguage?.csvTranslations;
  const isOnline = useNetworkStatus();
  const [selectedItem, setSelectedItem] = useState({
    name: "All Items",
    id: "",
    level: 0,
  });
  const [sort, setSort] = useState('')
  const [selectedParent, setSelectedParent] = useState(null);
  const [products, setProducts] = useState(productItems);
  const [categories, setCategories] = useState([
    { name: "All Items", id: "", level: 0, children: [] },
  ]);
  const [initialProducts, setInitialProducts] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Memoized function to group categories
  const groupCategories = useCallback((allCategories) => {
    const parentCategories = allCategories.filter((cat) => cat.level === 2);
    const childMap = allCategories.reduce((acc, cat) => {
      if (cat.level === 3) {
        acc[cat.parent_id] = acc[cat.parent_id] || [];
        acc[cat.parent_id].push(cat);
      }
      return acc;
    }, {});

    return [
      { name: "All Items", id: "", level: 0, children: [] },
      ...parentCategories.map((parent) => ({
        ...parent,
        children: childMap[parent.id] || [],
      })),
    ];
  }, []);

  // Load products with synchronization logic
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let productsData = productItems;
      let shouldUpdateIDB = false;
       await saveProducts(productsData);
      // Try to get fresh data if online
      // if (isOnline) {
      //   try {
      //     const freshProducts = await fetchMagentoProducts({
      //       id: "",
      //       sort: "",
      //       currency,
      //     });
          
      //     if (freshProducts?.length > 0) {
      //       productsData = freshProducts;
      //       shouldUpdateIDB = true;
      //     }
      //   } catch (onlineError) {
      //     console.warn("Failed to fetch fresh products, falling back to offline data:", onlineError);
      //   }
      // }

      // If no fresh data or offline, use IndexedDB
      if (productsData.length === 0) {
        const offlineProducts = await getIDBProducts();
        // if (offlineProducts?.length > 0) {
          productsData = offlineProducts;
        // } 
        // else if (productItems?.length > 0) {
        //   // Fallback to server props if IndexedDB is empty
        //   productsData = productItems;
        //   shouldUpdateIDB = true;
        // }
      }

      // Update state and IndexedDB if needed
      setProducts(productsData);
      setInitialProducts(productsData);
      
      // if (shouldUpdateIDB) {
      //   await saveProducts(productsData);
      // }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currency, isOnline, productItems]);

  // Load categories with synchronization logic
  const loadCategories = useCallback(async () => {
    try {
      let allCategories = category;
      let shouldUpdateIDB = false;

      // Try to get fresh data if online
      // if (isOnline) {
        try {
          // const freshCategories = await fetchMagentoCategories();
          if (allCategories?.data?.length > 0) {
            const normalized = normalizeCategories(allCategories.data);
            allCategories = normalized.allCategories;
            await saveCategories(allCategories)
            // shouldUpdateIDB = true;
          }
        } catch (onlineError) {
          console.warn("Failed to fetch fresh categories, falling back to offline data:", onlineError);
        }
      // }

      // If no fresh data or offline, use IndexedDB
      if (allCategories.length === 0) {
        const offlineCategories = await getIDBCategories();
        if (offlineCategories?.length > 0) {
          allCategories = offlineCategories;
        } 
        // else if (category?.data?.length > 0) {
        //   // Fallback to server props if IndexedDB is empty
        //   const normalized = normalizeCategories(category.data);
        //   allCategories = normalized.allCategories;
        //   shouldUpdateIDB = true;
        // }
      }

      // Update state and IndexedDB if needed
      const groupedCategories = groupCategories(allCategories);
      setCategories(groupedCategories);
      
      // if (shouldUpdateIDB) {
      //   await saveCategories(allCategories);
      // }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, [category, groupCategories, isOnline]);

  // Full sync function
  // const performFullSync = useCallback(async () => {
  //   if (!isOnline) return;
    
  //   try {
  //     setIsLoading(true);
  //     const [freshProducts, freshCategories] = await Promise.all([
  //       fetchMagentoProducts({ id: "", sort: "", currency }),
  //       fetchMagentoCategories(),
  //     ]);

  //     if (freshProducts?.length > 0) {
  //       await clearAllProducts();
  //       await saveProducts(freshProducts);
  //       setProducts(freshProducts);
  //       setInitialProducts(freshProducts);
  //     }

  //     if (freshCategories?.data?.length > 0) {
  //       const normalized = normalizeCategories(freshCategories.data);
  //       await clearCategories();
  //       await saveCategories(normalized.allCategories);
  //       setCategories(groupCategories(normalized.allCategories));
  //     }

  //     setLastSyncTime(new Date());
  //   } catch (err) {
  //     console.error("Full sync failed:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [currency, groupCategories, isOnline]);

  // // Initial load and periodic sync
  // useEffect(() => {
  //   loadProducts();
  //   loadCategories();

  //   // Set up periodic sync (every 30 minutes)
  //   const syncInterval = setInterval(() => {
  //     if (isOnline) {
  //       performFullSync();
  //     }
  //   }, 30 * 60 * 1000);

  //   return () => clearInterval(syncInterval);
  // }, [loadProducts, loadCategories, performFullSync, isOnline]);

    useEffect(() => {
    loadProducts();
    loadCategories();
    
  }, []);

  const handleCategoryClick = useCallback(async (category) => {
    setSelectedItem(category);
    setOpenDropdownId(null);

    if (category.name === "All Items") {
      setProducts(initialProducts);
      setSelectedParent(null);
      return;
    }

    const filtered = initialProducts.filter((item) =>
      item?.categories?.some((cat) => cat?.id === category.id)
    );
    setProducts(filtered);

    if (category.level === 2) {
      setSelectedParent(category);
    } else {
      try {
        const allCategories = await getIDBCategories();
        const parent = allCategories.find((cat) => cat.id === category.parent_id);
        if (parent) {
          setSelectedParent(parent);
        }
      } catch (err) {
        console.error("Error finding parent category:", err);
      }
    }
  }, [initialProducts]);

  const toggleDropdown = useCallback((e, id) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }, []);

  const handleAddToCart = useCallback(async (product, options, quantity) => {
    await addToCart(product, options, quantity);
  }, []);

    const handleSearch = (results) => {
      if (results.length > 0) {
        // Filter search results to only show simple products
        // const simpleResults = results.filter((item) => item?.__typename === "SimpleProduct");
        setDisplayedProducts(results);
      } else {
        // When search is cleared, show all simple products
        setDisplayedProducts(displayedProducts);
      }
    };

      const handleSelectChange = (event) => {
    const selectedValue = event.target.value;
    setSort(selectedValue);
  };
  return (
    <>
      <PageHead
        pageName={language?.catalog ?? "Catalog"}
        firstName={firstName}
        lastName={lastName}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />

      <div className={style.product_page}>
        <div className={style.categories}>
          <div className={style.cat_block}>
            {categories.map((item) => {
              const isOpen = openDropdownId === item.id;
              const hasChildren = item.children?.length > 0;

              return (
                <div className={style.dropdown_container} key={item.id}>
                  <div
                    className={`${style.dropdown_button} ${
                      item.id === selectedItem.id ||
                      item.id === selectedParent?.id
                        ? style.active
                        : ""
                    }`}
                    onClick={() => handleCategoryClick(item)}
                  >
                    {item.name}
                    {hasChildren && (
                      <span
                        className={style.arrow}
                        onClick={(e) => toggleDropdown(e, item.id)}
                      >
                        {isOpen ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  {hasChildren && isOpen && (
                    <ul className={style.dropdown_menu}>
                      {item.children.map((child) => (
                        <li
                          key={child.id}
                          className={
                            child.id === selectedItem.id ? style.active : ""
                          }
                          onClick={() => handleCategoryClick(child)}
                        >
                          {child.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
           <div className="search_row">
        <Search
          isProduct={true}
          handleAddToCart={handleAddToCart}
          products={products} 
          placeholder={language?.search_products ?? "Search Products"}
          setProducts={handleSearch}
        />

        <div className="sort-button section_padding">
        <p className="sort">Sort by:</p>
          <div className="sort-dropdown">
            <select onChange={handleSelectChange}>
              <option value="">{language?.default ?? 'Default'}</option>
              <option value="sort: { name: ASC }">{language?.name_asc ?? 'Name (ASC)'}</option>
               <option value="sort: { name: DESC }">{language?.name_desc ?? 'Name (DESC)'}</option>
              <option value="sort: { price: ASC }">{language?.price_asc ?? 'Price (ASC)'}</option>
              <option value="sort: { price: DESC }">{language?.price_desc ?? 'Price (DESC)'}</option>
            </select>
          </div>
        </div>
      </div>

          <Products
            products={products}
            id={selectedItem.id}
            setProducts={setProducts}
            handleAddToCart={handleAddToCart}
            currencySymbol={currencySymbol}
            currency={currency}
            language={language}
            isLoading={isLoading}
            // onRefresh={performFullSync}
            lastSyncTime={lastSyncTime}
            sort={sort}
            setSort={setSort}
          />
        </div>
      </div>
    </>
  );
}