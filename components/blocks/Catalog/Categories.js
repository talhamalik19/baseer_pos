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
import { fetchProductsAction as fetchMagentoProducts, getCategoriesAction as fetchMagentoCategories, fetchProductsAction } from "@/lib/Magento/actions";
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [sort, setSort] = useState('')
  const [selectedParent, setSelectedParent] = useState(null);
  const [products, setProducts] = useState(productItems);
  const [categories, setCategories] = useState([]);
  const [initialProducts, setInitialProducts] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [displayedProducts, setDisplayedProducts] = useState(products);

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

      // If no fresh data or offline, use IndexedDB
      if (productsData.length === 0) {
        const offlineProducts = await getIDBProducts();
        productsData = offlineProducts;
      }

      // Update state and IndexedDB if needed
      setProducts(productsData);
      setInitialProducts(productsData);

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

      try {
        if (allCategories?.data?.length > 0) {
          const normalized = normalizeCategories(allCategories.data);
          allCategories = normalized.allCategories;
          await saveCategories(allCategories)
        }
      } catch (onlineError) {
        console.warn("Failed to fetch fresh categories, falling back to offline data:", onlineError);
      }

      // If no fresh data or offline, use IndexedDB
      if (allCategories.length === 0) {
        const offlineCategories = await getIDBCategories();
        if (offlineCategories?.length > 0) {
          allCategories = offlineCategories;
        }
      }

      // Update state and IndexedDB if needed
      const groupedCategories = groupCategories(allCategories);
      setCategories(groupedCategories);

      // Set the first category as selected initially
      if (groupedCategories.length > 0 && !selectedItem) {
        setSelectedItem(groupedCategories[0]);
      }

    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, [category, groupCategories, isOnline, selectedItem]);

  useEffect(() => {
    loadProducts();
    loadCategories();

  }, []);

  const handleCategoryClick = useCallback(async (category) => {
    setSelectedItem(category);
    setOpenDropdownId(null);

    const filtered = initialProducts.filter((item) =>
      item?.categories?.some((cat) => cat?.name === category.name)
    );
    setProducts(filtered);
    setDisplayedProducts(filtered)
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
      setDisplayedProducts(results);
    } else {
      setDisplayedProducts(displayedProducts);
    }
  };

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value;
    setSort(selectedValue);
  };

  const getProducts = async () => {
    // Check network status
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        let offlineProducts = await getIDBProducts();

        // Filter by category if selected
        if (selectedItem?.id) {
          offlineProducts = offlineProducts.filter(p =>
            p.categories?.some(c => c.id === selectedItem.id || c.name === selectedItem.name)
          );
        }

        // Apply Sorting Locally
        if (sort) {
          const [field, direction] = sort.replace("sort: { ", "").replace(" }", "").split(": ");
          offlineProducts.sort((a, b) => {
            let valA = a[field];
            let valB = b[field];

            if (field === 'price') {
              valA = a.price?.regularPrice?.amount?.value || 0;
              valB = b.price?.regularPrice?.amount?.value || 0;
            }

            if (direction === 'ASC') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
          });
        }

        setProducts(offlineProducts);
        setDisplayedProducts(offlineProducts);
        return;
      } catch (err) {
        console.error("Error fetching offline products:", err);
      }
    }

    // Online: Fetch from API
    try {
      const res = await fetchProductsAction(selectedItem?.id || '', sort, currency);
      const fetchedProducts = res?.items || [];
      setProducts(fetchedProducts);
      setDisplayedProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      // Fallback to offline if API fails even if navigator says online
      const offlineProducts = await getIDBProducts();
      setProducts(offlineProducts);
      setDisplayedProducts(offlineProducts);
    }
  };

  // Update useEffect to include selectedItem.id as dependency
  useEffect(() => {
    getProducts();
  }, [sort, selectedItem?.id]);

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
                    className={`${style.dropdown_button} ${item.id === selectedItem?.id ||
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
                            child.id === selectedItem?.id ? style.active : ""
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
            id={selectedItem?.id}
            setProducts={setProducts}
            handleAddToCart={handleAddToCart}
            currencySymbol={currencySymbol}
            currency={currency}
            language={language}
            isLoading={isLoading}
            lastSyncTime={lastSyncTime}
            sort={sort}
            setSort={setSort}
            displayedProducts={displayedProducts}
            setDisplayedProducts={setDisplayedProducts}
          />
        </div>
      </div>
    </>
  );
}