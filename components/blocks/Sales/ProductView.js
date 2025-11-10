"use client";

import React, { useEffect, useState } from "react";
import Cards from "@/components/shared/Cards";
import ProductTable from "./ProductTable";
import CartSummary from "./POSCartSummary";
import Search from "@/components/shared/Search";
import { getViewMode, saveViewMode } from "@/lib/indexedDB";

export default function ProductView({
  products,
  setIsOpen,
  handleAddToCart,
  cartItems,
  setCartItems,
  pdfResponse,
  styles,
  jwt,
  orders,
  macAddress,
  username,
  posDetail,
  currencySymbol,
  currency,
  serverLanguage,
  warehouseId,
  payment,
  setPayment,
  applyTaxAfterDiscount,
  discountIncludingTax,
  fbrDetails,
}) {
  const [viewMode, setViewMode] = useState("cards"); // Default to cards view

  useEffect(() => {
    const fetchViewMode = async () => {
      const mode = await getViewMode();
      if (mode) {
        setViewMode(mode);
      }
    };
    fetchViewMode();
  }, []);

  // const handleViewChange = async (mode) => {
  //   setViewMode(mode);
  //   await saveViewMode(mode);
  // };

  return (
    <>
      <div className={styles.search}>
        <Search
          jwt={jwt}
          placeholder={serverLanguage?.search_products ?? "Search Products"}
          styleSearch={true}
          products={products}
          handleAddToCart={handleAddToCart}
          ordersResponse={orders}
          isPos={true}
          posDetail={posDetail}
          styles={styles}
          setViewMode={setViewMode}
          viewMode={viewMode}
          // payment={payment}
        />
      </div>
      <div className="page_detail sale_page">
      <div className={styles.cart_summary}>
        <div className={styles.table_block_cart}>
          {/* <div className={styles.view_controls}>
            <div className={styles.view_selector}>
              <button
                className={`${styles.view_btn} ${
                  viewMode === "cards" ? styles.active : ""
                }`}
                onClick={() => handleViewChange("cards")}
                aria-label="Cards View"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="2"
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 5h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M10 15h4M7 10h10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </div> */}

          {cartItems?.length > 0 ? (
            <>
              {viewMode === "table" ? (
                <ProductTable
                  cartItems={cartItems}
                  onCartChange={setCartItems}
                  styles={styles}
                  currencySymbol={currencySymbol}
                  serverLanguage={serverLanguage}
                  payment={payment}
                  setPayment={setPayment}
                  applyTaxAfterDiscount={applyTaxAfterDiscount}
                  discountIncludingTax={discountIncludingTax}
                  fbrDetails={fbrDetails}
                />
              ) : (
                <div className={styles.grid_wrapper}>
                  <div className={styles.grid_4}>
                    {cartItems.map((item) => (
                      <Cards
    key={item?.addedAt || item?.product?.uid}
                        item={item?.product}
                        record={item}
                        cards={true}
                        setCartItems={setCartItems}
                        currencySymbol={currencySymbol}
                        serverLanguage={serverLanguage}
                        payment={payment}
                        setPayment={setPayment}
                        applyTaxAfterDiscount={applyTaxAfterDiscount}
                        discountIncludingTax={discountIncludingTax}
                        fbrDetails={fbrDetails}
                        // taxPercent={taxPercent}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className={styles.no_prods}>
              {serverLanguage?.no_products ?? "No products"}
            </p>
          )}
        </div>

        <div className={styles.cart_container}>
          <CartSummary
            cartItems={cartItems}
            styles={styles}
            setCartItems={setCartItems}
            pdfResponse={pdfResponse}
            posDetail={posDetail}
            username={username}
            currencySymbol={currencySymbol}
            currency={currency}
            serverLanguage={serverLanguage}
            warehouseId={warehouseId}
            payment={payment}
            setPayment={setPayment}
            applyTaxAfterDiscount={applyTaxAfterDiscount}
            discountIncludingTax={discountIncludingTax}
            fbrDetails={fbrDetails}
          />
        </div>
      </div>
      </div>
    </>
  );
}
