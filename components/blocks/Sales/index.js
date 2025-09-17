"use client";

import React, { useEffect, useState } from 'react';
import { addToCart, getAllOrders, getCartItems, getPDFSettings, saveMultipleOrders, getViewMode, saveProducts } from '@/lib/indexedDB';
import { getProducts } from '@/lib/Magento';
import ProductView from './ProductView';
import styles from './sales.module.scss';
import { checkPOSCodeExists, getPOSData } from '@/lib/acl';

export default function SalesDetail({ jwt, productItems, ordersResponse, macAddress, username, currencySymbol, currency, serverLanguage }) {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [pdfResponse, setPdfResponse] = useState({});
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState("");
  const [posDetail, setPosDetail] = useState({})


  useEffect(() => {
    const fetchViewMode = async () => {
      const mode = await getViewMode();
      const data = localStorage.getItem("pos_code");
      if(data){
        setPosDetail(data)
      }
      setViewMode(mode);
    };
    fetchViewMode();
  }, []);

  useEffect(() => {
    // async function getPdf() {
    //   const result = ;
    //   if(result) {
    //     setPdfResponse(result);
    //   }
    // }
    // getPdf();
    if(typeof window != undefined){
      const res = JSON.parse(localStorage.getItem("jsonData"))
      setPdfResponse(res)
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (typeof window === "undefined") return;

      try {
        const offlineProducts = await getProducts();
        if (offlineProducts.length > 0) {
          setProducts(offlineProducts);
        } else {
          setProducts(productItems?.items || []);
          saveProducts(productItems?.items)
        }
      } catch (err) {
        console.error("IndexedDB Error:", err);
        setProducts(productItems?.items || []);
      }
    };

    fetchProducts();
  }, [productItems]);

  // Load cart from IndexedDB on mount
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

  // Handle adding product to cart
  const handleAddToCart = async (product, options, quantity) => {
    await addToCart(product, options, quantity);
    const updatedCart = await getCartItems();
    setCartItems(updatedCart);
  };

  return (
    <div className='page_detail'>
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
      />
    </div>
  );
}