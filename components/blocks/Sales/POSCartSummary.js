"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  saveOrder,
  clearCart,
  saveOrders,
  addItemsToSuspend,
  getCartItems,
} from "@/lib/indexedDB";
import { generateOrderId } from "@/lib/generateOrderId";
import { printReceipt } from "@/lib/printReceipt";
import styles from "../Catalog/cart.module.scss";
import { redirect } from "next/navigation";
import Link from "next/link";
import OrderControls from "./HandleSuspendOrders";
import SimpleAlertModal from "@/components/global/alertModal";
import generateReceiptPDF from "@/lib/generatePDF";
import QRCode from "qrcode";
import { encryptData } from "@/lib/crypto";
import { getCustomerConsentAction, submitConsentAction } from "@/lib/Magento/actions";

export default function POSCartSummary({
  cartItems,
  setCartItems,
  pdfResponse,
  posDetail,
  username,
  currencySymbol,
  currency,
  serverLanguage,
}) {
  let minutes = 2;
  const code = posDetail;
  const [discountPercent, setDiscountPercent] = useState(0);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentType, setPaymentType] = useState("checkmo");
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [consentModal, setConsentModal] = useState(false);
  const [qrcode, setQrCode] = useState("");
  const amountInputRef = useRef(null);

  const [thermalPrint, setThermalPrint] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [consentStatus, setConsentStatus] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [createCustomer, setCreateCustomer] = useState(true);
  const consentPromiseRef = useRef(null);

  // New state for consent change functionality
  const [changeConsent, setChangeConsent] = useState(false);
  const [consentChangeModal, setConsentChangeModal] = useState(false);

  useEffect(() => {
    setConsentStatus(null);
    setConsentChecked(false);
    setChangeConsent(false); // Reset consent change state
    consentPromiseRef.current = null;
  }, [email, phone]);

  const twilio = JSON.parse(localStorage.getItem("loginDetail"));

  const twilioRec = twilio?.twilio;

  const { subtotal, discountAmount, taxAmount, total, grandTotal } =
    useMemo(() => {
      let subtotal = 0;
      let taxAmount = 0;

      cartItems?.forEach((item) => {
        const price = item?.product?.special_price
          ? item?.product?.special_price
          : item?.product?.price?.regularPrice?.amount?.value || 0;
        const qty = item?.quantity || 0;
        const lineTotal = price * qty;

        subtotal += lineTotal;

        const taxRate = item?.product?.tax_percent || 0;
        taxAmount += (lineTotal * taxRate) / 100;
      });

      const discountAmount = (subtotal * discountPercent) / 100;
      const total = subtotal - discountAmount;
      const grandTotal = total + taxAmount;

      return { subtotal, discountAmount, taxAmount, total, grandTotal };
    }, [cartItems, discountPercent]);

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const numericAmount = parseFloat(amount) || 0;
    const calculatedBalance = (numericAmount - total).toFixed(2);
    setBalance(calculatedBalance);
  }, [amount, total]);

  const validateEmail = (email) => {
    return email === "" || /\S+@\S+\.\S+/.test(email);
  };

  const showAlert = (title, message) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
    });
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/[^\d+()-\s]/g, "");
    setPhone(value);
  };

  const handleAmountKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlaceOrder();
    }
  };

  function generateRandomId() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${datePart}_${randomPart}`;
  }

  const checkConsentFromAPI = async () => {
    if (!email && !phone) return null;
    if (consentChecked) return consentStatus;

    if (consentPromiseRef.current) {
      return consentPromiseRef.current;
    }

    const promise = (async () => {
      setConsentLoading(true);
      try {
        const res = await getCustomerConsentAction(email, phone);

        // in case of registered customer (consent given)
        if (Array.isArray(res) && res.length > 0 && res[0]?.consent) {
          setConsentStatus(res[0].consent);
          setConsentChecked(true);
          setChangeConsent(res?.[0]?.consent == "yes" ? true : false);
          return res[0].consent;
        }

        // in case of unregistered and registered but no consent customers
        if (Array.isArray(res) && res.length > 0 && res[0]?.consent == null) {
          setConsentStatus("not_set");
          setConsentChecked(true);
          return "not_set";
        }

        setConsentStatus(null);
        setConsentChecked(true);
        return "no";
      } catch (err) {
        console.error("Consent API error:", err);
        setConsentStatus("no");
        setConsentChecked(true);
        return "no";
      } finally {
        setConsentLoading(false);
        consentPromiseRef.current = null;
      }
    })();

    consentPromiseRef.current = promise;
    return promise;
  };

  const handleBlurContact = async () => {
    setIsInputFocused(false);
    await checkConsentFromAPI();
  };

  const handleFocusContact = () => {
    setIsInputFocused(true);
  };

    const handleConsentChange = async (checked) => {
    setChangeConsent(!checked);
  };

  const handlePlaceOrder = async () => {
    if (code == undefined) {
      redirect("/manage-pos?pos_code=false");
    }

    if (!validateEmail(email)) {
      showAlert("Invalid Email", "Please enter a valid email");
      return;
    }

    const numericAmount = parseFloat(amount) || 0;

    if (!cartItems || cartItems.length === 0) {
      showAlert("Empty Cart", "Your cart is empty.");
      return;
    }

    if (numericAmount < total) {
      showAlert(
        "Insufficient Amount",
        "Amount received is less than the total."
      );
      return;
    }

    const orderId = generateOrderId(posDetail);

    const customerDetails = {
      phone,
      email,
      paymentType,
    };

    const items = cartItems.map((item) => {
      const product = item?.product || {};
      const price = product?.price?.regularPrice?.amount?.value || 0;
      const originalPrice = product?.special_price
        ? product.special_price
        : price;
      const quantity = item.quantity || 1;
      const taxPercent = product?.tax_percent || 0;
      const priceInclTax = price * (1 + taxPercent / 100);
      const rowTotalInclTax = priceInclTax * quantity;
      const discountPercent = product?.pos_discount_percent || 0;
      const rowTotal = price * quantity * (1 - discountPercent / 100);

      return {
        product_id: product?.id || product?.product_id,
        product_sku: product?.sku || "",
        product_name: product?.name || "",
        price: price.toFixed(2),
        original_price: originalPrice.toFixed(2),
        qty: quantity,
        row_total: rowTotal.toFixed(2),
        discount_percent: discountPercent,
        tax_percent: taxPercent,
        price_incl_tax: priceInclTax.toFixed(2),
        row_total_incl_tax: rowTotalInclTax.toFixed(2),
      };
    });

    const orderData = {
      customer_phone: phone,
      order_key: generateRandomId(),
      create_acc: createCustomer,
      customer_email: email,
      increment_id: orderId,
      pos_device_info: code,
      admin_user: username,
      store_id: 1,
      customer_firstname: "POS",
      customer_last_name: "Customer",
      items,
      payment_method: paymentType,
      order_subtotal: subtotal.toFixed(2),
      order_grandtotal: total.toFixed(2),
      discount: discountPercent,
      order_date: new Date().toISOString(),
    };

    try {
      let finalConsent = consentStatus;
      if (!finalConsent) finalConsent = "no";

      if (!email && !phone) {
        await printReceipt(
          cartItems,
          total,
          amount,
          balance,
          customerDetails,
          pdfResponse,
          orderId,
          orderData?.order_key
        );
        // await saveOrder(orderData);
        // await saveOrders(orderData);
        // await clearCart();
        // setCartItems([]);
        // setAmount("");
        // setPhone("");
        // setEmail("");
        return;
      }

      if (changeConsent != (finalConsent == "yes" ? true : false)) {
        console.log("consent is changed incase of yes")
        // if (thermalPrint) {
        const consentRes = await submitConsentAction({
          increment_id: generateRandomId(),
          customer_email: email,
          phone_number: phone.length ? phone : "",
          consent: "no"
        })
          await printReceipt(
            cartItems,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key
          );
          //  await saveOrder(orderData);
          // await saveOrders(orderData);
          // await clearCart();
          // setCartItems([]);
          // setAmount("");
          // setPhone("");
          // setEmail("");
          return;
      }

      // Case 3: Consent is "yes" - send digital receipts with delay and re-check
      if (finalConsent === "yes") {
        console.log("consent is yes")
        if (thermalPrint) {
          await printReceipt(
            cartItems,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key
          );
        }
        // await saveOrder(orderData);
        // await saveOrders(orderData);
        // await clearCart();
        // setCartItems([]);
        // setAmount("");
        // setPhone("");
        // setEmail("");
      }

      // Case 4: Consent is "not_set" - show consent QR for first-time consent
      if (finalConsent === "not_set") {
        console.log("consent is not set")
        if (thermalPrint) {
          await printReceipt(
            cartItems,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key
          );
        }
        setConsentModal(true);
        const sessionId = orderData?.increment_id;
        const expiresAt = Date.now() + minutes * 60 * 1000;
        const encrypted = encryptData({
          sessionId,
          phone,
          email,
          expiresAt,
        });
        const code = await QRCode.toDataURL(
          `${
            process.env.NEXT_PUBLIC_BASE_URL
          }/consent?data=${encodeURIComponent(encrypted)}`
        );
        setQrCode(code);
        // await saveOrder(orderData);
        // await saveOrders(orderData);
        // await clearCart();
        // setCartItems([]);
        // setAmount("");
        // setPhone("");
        // setEmail("");
      }

      // Case 5: Consent is "no" - just print thermal, no digital receipts
      if (finalConsent == "no") {
        console.log("consent is no")
        await printReceipt(
          cartItems,
          total,
          amount,
          balance,
          customerDetails,
          pdfResponse,
          orderId,
          orderData?.order_key
        );
        // await saveOrder(orderData);
        // await saveOrders(orderData);
        // await clearCart();
        // setCartItems([]);
        // setAmount("");
        // setPhone("");
        // setEmail("");
        return;
      }
      console.log("fallback is called")
      try {
        const delayedJobData = {
          email,
          phone,
          orderId,
          orderData,
          pdfResponse,
          smsJob: phone
            ? {
                phone,
                order_key: orderData?.order_key,
                orderId,
                total: orderData?.order_grandtotal,
                createdAt: Date.now(),
                sid: twilioRec?.sid,
                auth_token: twilioRec?.auth_token,
                auth_phone: twilioRec?.phone,
              }
            : null,
        };

        if (email) {
          delayedJobData.pdfBase64 = await generateReceiptPDF(
            cartItems,
            total,
            amount,
            balance,
            customerDetails,
            orderId,
            orderData?.order_key,
            pdfResponse
          );
        }
        const res = await fetch("/api/schedule-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(delayedJobData),
        });

        if (res.ok) {
          console.log(
            "Delayed consent check scheduled successfully for order:",
            orderId
          );
        } else {
          console.error("Failed to schedule delayed consent check");
        }
      } catch (err) {
        console.error("Error setting up delayed receipt sending:", err);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      showAlert("Error", "Something went wrong while placing the order.");
    }
  };

  const handleSuspendOrders = async () => {
    if (!cartItems || cartItems.length === 0) return;

    const success = await addItemsToSuspend(cartItems);
    if (success) {
      await clearCart();
      const updatedCart = await getCartItems();
      setCartItems(updatedCart);
    } else {
      showAlert("Error", "Failed to suspend order.");
    }
  };

  return (
    <>
      <div className={styles.paymentContainer}>
        <h2>
          {currencySymbol}
          {total.toFixed(2)}
        </h2>

        <div className={styles.paymentDetails}>
          <div className={styles.customerDetailsSection}>
            <h3 className={styles.sectionTitle}>
              {serverLanguage?.customer_details ?? "Customer Details"}
            </h3>
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>
                {serverLanguage?.phone ?? "Phone"}:
              </p>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneInput}
                placeholder="(555) 123-4567"
                onFocus={handleFocusContact}
                onBlur={handleBlurContact}
              />
            </div>
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>
                {serverLanguage?.email ?? "Email"}:
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className={validateEmail(email) ? "" : styles.invalidInput}
                onFocus={handleFocusContact}
                onBlur={handleBlurContact}
              />
            </div>

            {/* New consent change checkbox - only show when consent is "yes" or "no" */}
            {(consentStatus === "yes" || consentStatus === "no") &&
              (email || phone) && (
                <div
                  className={`${styles.paymentDetailBlock} ${styles.paymentConsentBlock}`}
                >
                  {consentStatus == "yes" ? (
                    <label className={styles.checkboxWrapper}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={!changeConsent}
                        onChange={(e) => handleConsentChange(e.target.checked)}
                      />
                      <span className={styles.customCheck}></span>
                      I do not wish to receive an e-receipt.
                    </label>
                  ) : (
                    <>
                    <p>{"The customer don't want to receive E-Receipts."}</p>
                      {/* 👉 New button to open consent change modal */}
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={async () => {
                      setConsentChangeModal(true);
                      const sessionId = generateRandomId();
                      const expiresAt = Date.now() + minutes * 60 * 1000;
                      const encrypted = encryptData({
                        sessionId,
                        phone,
                        email,
                        expiresAt,
                      });
                      const code = await QRCode.toDataURL(
                        `${
                          process.env.NEXT_PUBLIC_BASE_URL
                        }/consent?data=${encodeURIComponent(encrypted)}`
                      );
                      setQrCode(code);
                    }}
                    style={{ marginTop: "10px" }}
                  >
                    Change Consent
                  </button>
                  </>
                  )}

                  {/* <label className={styles.checkboxWrapper}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={changeConsent}
          onChange={(e) => handleConsentChange(e.target.checked)}
        />
        <span className={styles.customCheck}></span>
        Do you want E-Receipt
      </label> */}
                </div>
              )}
          </div>

          <div className={styles.paymentDetailBlock}>
            <label className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={thermalPrint}
                onChange={(e) => setThermalPrint(e.target.checked)}
              />
              <span className={styles.customCheck}></span>
              Do you want thermal print?
            </label>
          </div>

          <div className={styles.paymentDetailBlock}>
            <label className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={createCustomer}
                onChange={(e) => setCreateCustomer(e.target.checked)}
              />
              <span className={styles.customCheck}></span>
              Do you want to create customer?
            </label>
          </div>

          {cartItems[0]?.product?.apply_discount_on != "product" && (
            <div className={styles.paymentDetailBlock}>
              <p className={styles.paymentTitle}>
                {serverLanguage?.Discount ?? "Discount"} (%):
              </p>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) =>
                  setDiscountPercent(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          )}

          <div className={styles.paymentDetailBlock}>
            <p className={styles.paymentTitle}>
              {serverLanguage?.payment_type ?? "Payment Type"}:
            </p>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="checkmo">{serverLanguage?.cash ?? "Cash"}</option>
            </select>
          </div>

          <div className={styles.paymentDetailBlock}>
            <p className={styles.paymentTitle}>
              {serverLanguage?.amount_received ?? "Amount Received"}:
            </p>
            <input
              ref={amountInputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleAmountKeyDown}
              placeholder="0.00"
            />
          </div>

          <div className={styles.paymentDetailBlock}>
            <p className={styles.paymentTitle}>
              {serverLanguage?.balance ?? "Balance"}:
            </p>
            <input type="text" value={balance} readOnly placeholder="0.00" />
          </div>

          {/* <div className={styles.paymentDetailBlock}>
            <label className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                className={styles.checkbox}
                id="consent"
                value={consent}
                onChange={handleChangeConsent}
              />
              <span className={styles.customCheck}></span>
              <div>
                I agree to receive Smart Receipts via WhatsApp and Email and
                consent to the use of my personal information as{" "}
                <span
                  className={styles.consent_popup}
                  onClick={() => setConsentModal(true)}
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                >
                  described here.
                </span>
              </div>
            </label>
          </div> */}
          <OrderControls
            cartItems={cartItems}
            addItemsToSuspend={addItemsToSuspend}
            clearCart={clearCart}
            getCartItems={getCartItems}
            setCartItems={setCartItems}
            setAmount={setAmount}
          />
          <button
            onClick={handlePlaceOrder}
            className={styles.completeButton}
            // disable while user is entering contact, or while consent API is in-flight,
            // or when email is provided but invalid
            disabled={
              isInputFocused ||
              consentLoading ||
              (email !== "" && !validateEmail(email))
            }
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
            Place Order
          </button>
        </div>
      </div>

      <SimpleAlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />

      {consentModal && (
        <SimpleAlertModal
          consent={true}
          isOpen={consentModal}
          onClose={() => setConsentModal(false)}
          title="Consent QR Code"
          qrcode={qrcode}
        />
      )}

      {/* New modal for consent change */}
      {consentChangeModal && (
        <SimpleAlertModal
          consent={true}
          isOpen={consentChangeModal}
          onClose={() => setConsentChangeModal(false)}
          title="Change Consent Preference"
          qrcode={qrcode}
        />
      )}
    </>
  );
}
