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

    // Reset parent component's filtered results
    if (setSearchResults) {
      setSearchResults([]);
    }
  };
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setSelectedIndex(0);

    // if (!value.trim()) {
    //   console.log("no")
    //   setLocalSearchResults([]);
    //   if (isCustomer) {
    //     setCustomer(customer); // Reset to original customer list
    //   }
    //   if (setSearchResults) {
    //     setSearchResults([]); // Tell parent component to reset filters
    //   }
    //   return;
    // }

    const searchTerm = value.toLowerCase();
    let results = [];

    if (isProduct) {
      results = getFilteredProducts(products, searchTerm);
      setProducts(results);
    } else if (isEmployee) {
      results = getFilteredEmployees(employee, searchTerm);
      setEmployeeRecord(results);
    } else if (isPos) {
      if (code == undefined) {
        redirect("/manage-pos?pos_code=false");
      }
      results = await getFilteredProducts(products, searchTerm);
      setShowPopup(!!value.trim());
    } else if (isCustomer) {
      if (!searchTerm.trim()) {
        results = await getCustomerAction("", 10, 1);
        setCustomer(results?.data);
        if (setPagination) {
          setPagination(results?.total_count || 35);
        }
      } else {
        results = await getCustomerAction(searchTerm, 10, 1);
        setCustomer(results?.data);
        if (setPagination) {
          setPagination(results?.total_count || 1);
        }
      }
    } else {
      if (!searchTerm.trim()) {
        setSearchResults(orderItems);
        setPagination(orderItems?.length);
      } else {
        const filteredOrders = {
          email: "",
          phone: "",
          orderNumber: searchTerm,
          billName: "",
          status: "",
          isPosOrder: null,
          isWebOrder: null,
          isMobOrder: null,
          posCode: "",
          dateFrom: "",
          dateTo: "",
        };
        results = await getOrderDetailsAction(filteredOrders, 10, 1);
        if (results?.data) {
          setPagination(1);
          if (setSearchResults) {
            setSearchResults(results?.data);
          }
        }
      }
    }

    setLocalSearchResults(results);
  };

  // Rest of your Search component code remains the same...
  const handleKeyDown = async (e) => {
    // if (!searchResults.length) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = searchResults[selectedIndex];
      if (orders) {
        if (!searchValue.trim()) {
          setSearchResults(orderItems);
          setPagination(null);
        }
      }
      if (isCustomer) {
        if (!searchValue.trim()) {
          setPagination(14);
        }
      }
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
      <input
        className="search_item"
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        aria-label="Search"
        autoComplete="off"
      />

      {showPopup && searchResults.length > 0 && (
        <div className="search-suggestions" ref={resultsRef}>
          {searchResults.map((item, index) => {
const isHovered = hoveredIndex === index;
const isKeyboardSelected = selectedIndex === index && hoveredIndex === null;
const isSelected = isHovered || isKeyboardSelected;
            const commonStyle = {
              backgroundColor: isSelected ? "#f4f7f4" : "",
              transition: "all 0.2s ease",
            };

            if (isProduct && !item?.increment_id) {
              // Regular product item
              return (
                <div
                  key={item.id || index}
                  className={`search_items ${
                    isSelected ? "selected-item" : ""
                  }`}
                  onClick={() => handleAddProduct(item)}
                  style={{
                    ...commonStyle,
                    display: "flex",
                    gap: "20px",
                    alignItems: "center",
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
                  />
                  <div className="item-details">
                    <p className="item_name">{item?.name || item?.title}</p>
                    {item?.sku && <p className="item_sku">SKU: {item.sku}</p>}
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
            } else if (item?.increment_id) {
              // Order item
              return (
                <div
                  key={item.entity_id || index}
                  className={`search_items ${
                    isSelected ? "selected-item" : ""
                  }`}
                  onClick={() => handleOrderSelection(item)}
                  style={{ ...commonStyle, cursor: "pointer" }}
                >
                  <p className="item_name">
                    Order #{item.increment_id} -{" "}
                    {item?.shipping_address?.firstname}{" "}
                    {item?.shipping_address?.lastname}
                  </p>
                  <p className="order_meta">
                    Total: ${item.order_grandtotal} | City:{" "}
                    {item.shipping_address?.city}
                  </p>
                  {isSelected && (
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderSelection(item);
                      }}
                    >
                      Add Items
                    </button>
                  )}
                </div>
              );
            } else {
              // Default case
              return (
             <div
  key={item.id || index}
  className={`search_items ${isSelected ? "selected-item" : ""}`}
  onClick={() => handleAddProduct(item)}
  onMouseEnter={() => setHoveredIndex(index)}
  onMouseLeave={() => setHoveredIndex(null)}
  style={{
    ...commonStyle,
    display: "flex",
    gap: "20px",
    alignItems: "center",
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
  />
  <div className="item-details">
    <p className="item_name">{item?.name || item?.title}</p>
    {item?.sku && <p className="item_sku">SKU: {item.sku}</p>}
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
            }
          })}
        </div>
      )}

      {selectedProduct && isModalOpen && (
        <ProductOptionsModal
          item={selectedProduct}
          isOpen={isModalOpen}
          onClose={resetSearch}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
