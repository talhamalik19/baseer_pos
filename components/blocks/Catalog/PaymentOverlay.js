"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  clearCart,
  saveOrder,
  saveOrders,
} from "@/lib/indexedDB";
import { generateOrderId } from "@/lib/generateOrderId";
import { printReceipt } from "@/lib/printReceipt";

const PaymentOverlay = ({
  isOpen,
  onClose,
  totalAmount,
  styles,
  cart,
  setCart,
  pdfResponse
}) => {
  const [amount, setAmount] = useState(totalAmount.toFixed(2));
  const [balance, setBalance] = useState("0.00");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");

  const amountInputRef = useRef(null);

  const validateEmail = (email) => {
    return email === "" || /\S+@\S+\.\S+/.test(email);
  };

  useEffect(() => {
    if (isOpen && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const numericAmount = parseFloat(amount) || 0;
    const calculatedBalance = (numericAmount - totalAmount).toFixed(2);
    setBalance(calculatedBalance);
  }, [amount, totalAmount]);

  const handleCompletePayment = async () => {
    if (!validateEmail(email)) {
      alert("Please enter a valid email");
      return;
    }
  
    const numericAmount = parseFloat(amount) || 0;
  
    if (!cart || cart.length === 0) {
      return;
    }
  
    if (numericAmount < totalAmount) {
      return;
    }
  
    const orderId = generateOrderId();
  
    const customerDetails = {
      phone,
      email,
      paymentType,
    };
  
    const items = cart.map((item) => {
      const product = item?.product || {};
      const isConfigurable = product.__typename === "ConfigurableProduct";
      const price = product?.price?.regularPrice?.amount?.value || 0;
      const quantity = item.quantity || 1;
    
      return {
        product_id: product?.id || null,
        uid: product?.uid || "",
        product_sku: product?.sku || "",
        product_name: product?.name || "",
        product_price: price,
        qty: quantity,
        product_type: isConfigurable ? "configurable" : "simple",
        super_attribute: item?.selected_options || [],
        category: Array.isArray(product?.categories)
          ? product.categories.map((cat) => ({
              name: cat?.name || "",
            }))
          : [],
        image: product?.image?.url || "",
        small_image: product?.small_image?.url || "",
        thumbnail: product?.thumbnail?.url || "",
        row_total: price * quantity,
        tax_amount: 0,
        discount_amount: 0,
        total: price * quantity,
        base_price: price,
        base_row_total: price * quantity,
        base_total: price * quantity,
        base_tax_amount: 0,
        base_discount_amount: 0,
      };
    });
    
  
    const orderData = {
      mailto: phone,
      customer_email: email,
      created_at: new Date().toISOString(),
  customer_firstname: "POS",
  customer_lastname: "Customer",
  entity_id: orderId, 
  invoice: null,
  order_grandtotal: totalAmount?.toFixed(4) || "0.0000",

  payment: {
    payment_id: 0,
    payment_method: "cashondelivery",
    payment_method_title: "Check / Money order",
  },

  shipping_address: {
    firstname: "",
    lastname: "",
    city: "",
    region: null,
    postcode: "",
    street: "",
  },
      increment_id: orderId,
      pos_device_info: "1234-0000",
      store_id: 1,
      shipping_method: "flatrate_flatrate",
      payment_method: "cashondelivery",
      items,
    };
    try {
      await saveOrder(orderData);
      await saveOrders(orderData)
  
      await printReceipt(cart, totalAmount, amount, balance, customerDetails, pdfResponse, orderId);
  
      await clearCart();
      setCart([]);
      onClose();
      setAmount(0);
      setPhone("");
      setEmail("");
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };
  

  const handleAmountKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCompletePayment();
    }
  };

  const handlePhoneInput = (e) => {
    // Only allow numbers and common phone characters
    const value = e.target.value.replace(/[^\d+()-\s]/g, '');
    setPhone(value);
  };


  return (
      isOpen &&  (<>
        <div className={styles.overlayBackground} onClick={onClose} />
      <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`}>
        <div className={styles.paymentContainer}>
          <h2>${totalAmount.toFixed(2)}</h2>
          <div className={styles.paymentDetails}>
          <div className={styles.customerDetailsSection}>
              <h3 className={styles.sectionTitle}>Customer Details</h3>
              <div className={styles.paymentDetailBlock}>
                <p className={styles.paymentTitle}>Phone:</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneInput}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className={styles.paymentDetailBlock}>
                <p className={styles.paymentTitle}>Email:</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className={validateEmail(email) ? '' : styles.invalidInput}
                />
              </div>
            </div>
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>Payment Total:</p>
              <span>${totalAmount.toFixed(2)}</span>  
            </div>
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>Payment Type:</p>
              <select 
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Mobile Payment">Mobile Payment</option>
              </select>
            </div>
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>Amount:</p>
              <input
                ref={amountInputRef}
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleAmountKeyDown}
              />
            </div>
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>Balance:</p>
              <input type="text" value={balance} readOnly />
            </div>
            
            <button
              onClick={handleCompletePayment}
              className={styles.completeButton}
              disabled={!validateEmail(email)}
            >
              <svg
                width="22"
                height="23"
                viewBox="0 0 22 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11 19.75C12.0834 19.75 13.1562 19.5366 14.1571 19.122C15.1581 18.7074 16.0675 18.0997 16.8336 17.3336C17.5997 16.5675 18.2074 15.6581 18.622 14.6571C19.0366 13.6562 19.25 12.5834 19.25 11.5C19.25 10.4166 19.0366 9.3438 18.622 8.34286C18.2074 7.34193 17.5997 6.43245 16.8336 5.66637C16.0675 4.90029 15.1581 4.2926 14.1571 3.87799C13.1562 3.46339 12.0834 3.25 11 3.25C8.81196 3.25 6.71354 4.11919 5.16637 5.66637C3.61919 7.21354 2.75 9.31196 2.75 11.5C2.75 13.688 3.61919 15.7865 5.16637 17.3336C6.71354 18.8808 8.81196 19.75 11 19.75ZM10.7873 14.8367L15.3707 9.33667L13.9627 8.16333L10.021 12.8924L7.98142 10.8519L6.68525 12.1481L9.43525 14.8981L10.1448 15.6076L10.7873 14.8367Z"
                  fill="white"
                />
              </svg>
              Complete
            </button>
          </div>
        </div>
      </div>  </>)
  
  )
};

export default PaymentOverlay;


