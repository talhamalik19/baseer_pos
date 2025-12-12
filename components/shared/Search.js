"use client";
import React, { useEffect, useRef, useState } from "react";
import ProductOptionsModal from "../blocks/Catalog/ProductOptionsModal";
import { redirect, useRouter } from "next/navigation";
import {
  getFilteredEmployees,
  getFilteredProducts,
} from "@/lib/getSearchResults";
import {
  getCustomerAction,
  getOrderDetailsAction,
  getOrdersAction,
  searchProductsAction,
} from "@/lib/Magento/actions";
import { getViewMode, saveViewMode } from "@/lib/indexedDB";

export default function Search({
  isProduct,
  handleAddToCart,
  products,
  placeholder,
  styleSearch,
  orders,
  orderItems = [],
  ordersResponse,
  isCustomer,
  customer,
  isEmployee,
  employee,
  setEmployeeRecord,
  setProducts,
  isPos,
  setCustomer,
  setSearchResults,
  pagination,
  setPagination,
  posDetail,
  total_count,
  originalCustomers,
  styles,
  viewMode,
  setViewMode,
  canAddEmployee,
  handleEmployeeCreate,
  serverLanguage,
  searchInputRef,
  page = 1,
  pageSize = 10,
  setPage,
  setPageSize,
  isSearching = false
}) {
  const code = posDetail;
  const router = useRouter();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setLocalSearchResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      hoveredIndex === null && // only scroll if not hovering
      resultsRef.current?.children[selectedIndex]
    ) {
      resultsRef.current.children[selectedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex, hoveredIndex]);

  const resetSearch = () => {
    setSearchValue("");
    setLocalSearchResults([]);
    setSelectedIndex(0);
    setSelectedProduct(null);
    setIsModalOpen(false);
    setShowPopup(false);

    // Reset parent component's filtered results
    if (setSearchResults) {
      setSearchResults("", page, pageSize);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setSelectedIndex(0);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debouncing
    const timeout = setTimeout(async () => {
      if (orders && setSearchResults) {
        // For orders, always use API search with current pagination
        await setSearchResults(value, page, pageSize);
        // Don't show popup for order search
        setShowPopup(false);
        return;
      }

      const searchTerm = value.toLowerCase();
      let results = [];

      if (isProduct) {
        results = getFilteredProducts(products, searchTerm);
        setProducts(results);
        // Only show popup for POS products
        setShowPopup(isPos && !!value.trim() && results.length > 0);
      } else if (isEmployee) {
        results = getFilteredEmployees(employee, searchTerm);
        setEmployeeRecord(results);
        // Don't show popup for employees
        setShowPopup(false);
      } else if (isPos) {
        if (code == undefined) {
          redirect("/manage-pos?pos_code=false");
        }
        results = await getFilteredProducts(products, searchTerm);
        // Show popup only for POS with results
        setShowPopup(!!value.trim() && results.length > 0);
        setLocalSearchResults(results);
      } else if (isCustomer) {
        if (!searchTerm.trim()) {
          results = await getCustomerAction("", pageSize, page);
          setCustomer(results?.data);
          if (setPagination) {
            setPagination(results?.total_count || 0);
          }
          setShowPopup(false);
        } else {
          results = await getCustomerAction(searchTerm, pageSize, page);
          setCustomer(results?.data);
          if (setPagination) {
            setPagination(results?.total_count || 0);
          }
          // Don't show popup for customers
          setShowPopup(false);
        }
      } else {
        // Default case - use client-side filtering for non-API searches
        if (!searchTerm.trim()) {
          setLocalSearchResults([]);
          setShowPopup(false);
          if (setSearchResults) {
            setSearchResults("", page, pageSize);
          }
        } else {
          // Client-side filtering for other cases
          const filtered = orderItems.filter(item => 
            item?.increment_id?.toLowerCase().includes(searchTerm) ||
            item?.customer_firstname?.toLowerCase().includes(searchTerm) ||
            item?.customer_lastname?.toLowerCase().includes(searchTerm) ||
            item?.customer_email?.toLowerCase().includes(searchTerm)
          );
          setLocalSearchResults(filtered);
          // Only show popup if not orders and has results
          setShowPopup(!orders && filtered.length > 0);
        }
      }

      // Only set local results for non-order searches
      if (!orders) {
        setLocalSearchResults(results);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (orders && setSearchResults) {
        // For orders, trigger search on Enter
        await setSearchResults(searchValue, page, pageSize);
        setShowPopup(false);
        return;
      }

      if (!searchResults.length) return;

      const selectedItem = searchResults[selectedIndex];
      if (!selectedItem) return;

      if (selectedItem.increment_id) {
        // Handle order item
        handleOrderSelection(selectedItem);
      } else {
        // Handle product item
        handleAddProduct(selectedItem);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setShowPopup(false);
    }
  };

  // Keep focus on input when interacting with dropdown
  const handleItemMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleItemMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleItemClick = (item, index) => {
    if (isProduct && !item?.increment_id) {
      handleAddProduct(item);
    } else if (item?.increment_id) {
      handleOrderSelection(item);
    } else {
      handleAddProduct(item);
    }
    
    // Keep focus on input after selection
    if (searchInputRef?.current) {
      searchInputRef.current.focus();
    }
  };

  const handleAddProduct = (item) => {
    const isSimple = item?.__typename === "SimpleProduct";
    const hasRequiredOptions = Array.isArray(item?.options)
      ? item.options.some((option) => option.required)
      : false;
    const quantityToAdd =
      parseFloat(
        item?.custom_attributes?.find(
          (attr) => attr?.attribute_code === "qty_increment_step"
        )?.attribute_value
      ) || 1;
    
    if (isSimple && !hasRequiredOptions) {
      handleAddToCart(item, [], quantityToAdd);
      resetSearch();
    } else {
      // Either it's not simple OR it has required options, show modal
      setSelectedProduct(item);
      setIsModalOpen(true);
    }

    setShowPopup(false);
  };

  const handleOrderSelection = (order) => {
    if (!isProduct && order?.increment_id && !isPos) {
      router.push(`/order/${order.increment_id}`);
      resetSearch();
      setShowPopup(false);
      return;
    }
    
    // For POS, add order items to cart
    const buildProductData = (item) => ({
      sku: item.product_sku || item.sku,
      uid: item.uid || btoa((item.product_id || "").toString()),
      __typename:
        item.product_type === "configurable"
          ? "ConfigurableProduct"
          : "SimpleProduct",
      name: item.product_name || item.name,
      small_image: {
        url: item.small_image || item.image || "",
        label: item.product_name || item.name || "",
      },
      thumbnail: {
        url: item.thumbnail || item.image || "",
        label: item.product_name || item.name || "",
      },
      image: {
        url: item.image || item.thumbnail || "",
        label: item.product_name || item.name || "",
      },
      price: {
        regularPrice: {
          amount: {
            currency: item.currency || "USD",
            value: item.product_price || item.item_price || 0,
          },
        },
      },
      price_range: {
        minimum_price: {
          final_price: {
            currency: item.currency || "USD",
            value: item.product_price || item.item_price || 0,
          },
        },
      },
      special_price: item.special_price || null,
      super_attribute: item.super_attribute || [],
      product_id: item.product_id,
      category: item.category || [],
    });

    const addItemsToCart = (items, qtyKey = "item_qty_ordered") => {
      items.forEach((item) => {
        const productData = buildProductData(item);
        const quantity = parseInt(item[qtyKey] || 1);
        handleAddToCart(productData, productData?.super_attribute, quantity);
      });
    };

    if (order?.items && Array.isArray(order.items)) {
      addItemsToCart(order.items, "item_qty_ordered");
    } else if (ordersResponse) {
      const foundOrder = ordersResponse.data?.find(
        (o) => o.increment_id === order.increment_id
      );
      if (foundOrder && foundOrder.items) {
        addItemsToCart(foundOrder.items, "qty_ordered");
      }
    }

    resetSearch();
    setShowPopup(false);
  };

  const handleConfirm = ({ product, childSku, options }) => {
    const skuToUse = childSku || product.sku;
    const item = { ...product, sku: skuToUse };
    handleAddToCart(item, options, 1);
    resetSearch();
  };

  return (
    <div
      className={`search_field section_padding ${
        styleSearch ? "sales_order" : ""
      }`}
      ref={searchRef}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          className="search_item"
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          aria-label="Search"
          autoComplete="off"
          ref={searchInputRef}
        />
        {isSearching && (
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: '12px'
          }}>
            Searching...
          </div>
        )}
      </div>

      {isEmployee && canAddEmployee && (
        <button onClick={handleEmployeeCreate} className="add_employee_btn">
          {serverLanguage?.add_new_employee ?? "Add New Employee"}
        </button>
      )}
      
      {/* Only show view controls for POS */}
      {isPos && styles && (
        <div className={styles.view_controls}>
          <div className={styles.view_selector}>
            <button
              className={`${styles.view_btn} ${
                viewMode === "cards" ? styles.active : ""
              }`}
              onClick={() => handleViewChange("cards")}
              aria-label="Cards View"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.6667 2H3.33333C2.59695 2 2 2.59695 2 3.33333V12.6667C2 13.403 2.59695 14 3.33333 14H12.6667C13.403 14 14 13.403 14 12.6667V3.33333C14 2.59695 13.403 2 12.6667 2Z"
                  stroke="white"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 6H14"
                  stroke="white"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 10H14"
                  stroke="white"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 2V14"
                  stroke="white"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 2V14"
                  stroke="white"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              className={`${styles.view_btn} ${
                viewMode === "table" ? styles.active : ""
              }`}
              onClick={() => handleViewChange("table")}
              aria-label="Table View"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 3.33334H2.00667"
                  stroke="#0A0A0A"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 8H2.00667"
                  stroke="#0A0A0A"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12.6667H2.00667"
                  stroke="#0A0A0A"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.33325 3.33334H13.9999"
                  stroke="#0A0A0A"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.33325 8H13.9999"
                  stroke="#0A0A0A"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.33325 12.6667H13.9999"
                  stroke="#0A0A0A"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Only show popup for POS products */}
      {showPopup && isPos && searchResults.length > 0 && (
        <div className="search-suggestions" ref={resultsRef}>
          {searchResults.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const isKeyboardSelected =
              selectedIndex === index && hoveredIndex === null;
            const isSelected = isHovered || isKeyboardSelected;
            const commonStyle = {
              backgroundColor: isSelected ? "#f4f7f4" : "",
              transition: "all 0.2s ease",
            };

            return (
              <div
                key={item.id || index}
                className={`search_items ${
                  isSelected ? "selected-item" : ""
                }`}
                onClick={() => handleItemClick(item, index)}
                onMouseEnter={() => handleItemMouseEnter(index)}
                onMouseLeave={handleItemMouseLeave}
                style={{
                  ...commonStyle,
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <img
                  className="image"
                  src={
                    item?.thumbnail?.url ||
                    item?.thumbnail ||
                    item?.image ||
                    "/no-image.png"
                  }
                  alt={item?.name || item?.title}
                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                />
                <div className="item-details" style={{ flex: 1 }}>
                  <p className="item_name">
                    {item?.name || item?.title}
                  </p>
                  {item?.sku && (
                    <p className="item_sku">
                      SKU: {item.sku}
                    </p>
                  )}
                  {item?.price_range?.minimum_price?.final_price?.value && (
                    <p className="item_price" >
                      ${item.price_range.minimum_price.final_price.value}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddProduct(item);
                    }}
                
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && isModalOpen && (
        <ProductOptionsModal
          item={selectedProduct}
          isOpen={isModalOpen}
          onClose={resetSearch}
          onConfirm={handleConfirm}
          allProducts={products}
        />
      )}
    </div>
  );
}