"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  addToCart,
  getAllOrders,
  getCartItems,
  getPDFSettings,
  saveMultipleOrders,
  getViewMode,
  saveProducts,
} from "@/lib/indexedDB";
import { getProducts } from "@/lib/Magento";
import ProductView from "./ProductView";
import styles from "./sales.module.scss";

export default function SalesDetail({
  jwt,
  productItems,
  ordersResponse,
  macAddress,
  username,
  currencySymbol,
  currency,
  serverLanguage,
  warehouseId,
}) {
  const [products, setProducts] = useState([]);
  const [payment, setPayment] = useState("cashondelivery");
  const [cartItems, setCartItems] = useState([]);
  const [pdfResponse, setPdfResponse] = useState({});
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState("");
  const [posDetail, setPosDetail] = useState("");

  const loginDetails = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("loginDetail"))
    : null;

  const applyTaxAfterDiscount = parseInt(loginDetails?.apply_tax_after_discount);
  const discountIncludingTax = parseInt(loginDetails?.discount_including_tax);

  useEffect(() => {
    const fetchViewMode = async () => {
      const mode = await getViewMode();
      const shortPosCode = localStorage.getItem("pos_code");

      if (shortPosCode && loginDetails?.fbr_tax) {
        const fullKey = Object.keys(loginDetails.fbr_tax).find((k) =>
          k.startsWith(shortPosCode)
        );

        if (fullKey) {
          setPosDetail(fullKey);
        } else {
          setPosDetail(shortPosCode);
        }
      }

      setViewMode(mode);
    };

    fetchViewMode();
  }, [loginDetails]);

  useEffect(() => {
    if (typeof window != "undefined") {
      const res = JSON.parse(localStorage.getItem("jsonData"));
      setPdfResponse(res);
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (typeof window === "undefined") return;

      try {
        const offlineProducts = await getProducts({});
        if (offlineProducts.length > 0) {
          setProducts(offlineProducts);
        } else {
          setProducts(productItems?.items || []);
          saveProducts(productItems?.items);
        }
      } catch (err) {
        console.error("IndexedDB Error:", err);
        setProducts(productItems?.items || []);
      }
    };

    fetchProducts();
  }, [productItems]);

  useEffect(() => {
    const fetchCart = async () => {
      const items = await getCartItems();
      setCartItems(items);
    };
    fetchCart();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (typeof window === "undefined") return;

      try {
        const offlineOrders = await getAllOrders();
        if (offlineOrders.length > 0) {
          setOrders(offlineOrders);
        } else {
          setOrders(ordersResponse?.data);
          saveMultipleOrders(ordersResponse?.data);
        }
      } catch (err) {
        console.error("IndexedDB Error:", err);
      }
    };

    fetchOrders();
  }, [ordersResponse]);

  const handleAddToCart = async (product, options, quantity, taxAmount) => {
    await addToCart(product, options, quantity, taxAmount);
    const updatedCart = await getCartItems();
    setCartItems(updatedCart);
  };

  const fbrDetails = useMemo(() => {
    if (!loginDetails?.fbr_tax || !posDetail) return null;
    return loginDetails.fbr_tax[posDetail] || null;
  }, [loginDetails, posDetail]);

  return (
    <ProductView
      products={products}
      setIsOpen={setIsOpen}
      handleAddToCart={handleAddToCart}
      cartItems={cartItems}
      setCartItems={setCartItems}
      pdfResponse={pdfResponse}
      styles={styles}
      jwt={jwt}
      orders={orders}
      macAddress={macAddress}
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
  );
}
