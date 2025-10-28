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
import { decryptData, encryptData } from "@/lib/crypto";
import {
  getCustomerConsentAction,
  submitConsentAction,
} from "@/lib/Magento/actions";
import { submitRecordToFbr } from "@/lib/submitInvoiceToFbr";

export default function POSCartSummary({
  cartItems,
  setCartItems,
  pdfResponse,
  posDetail,
  username,
  currencySymbol,
  currency,
  serverLanguage,
  warehouseId,
  payment,
  setPayment,
  disocuntIncludingTax,
  applyTaxAfterDiscount,
  fbrDetails,
}) {
  const companyDetail = JSON.parse(localStorage?.getItem("company_detail"));
  const consentTimerStorage = JSON.parse(localStorage.getItem("loginDetail"));
  const decryptedSmtp = decryptData(consentTimerStorage?.smtp_config);
  const consentTimer = consentTimerStorage?.consent_timer;
  const minutes = consentTimer ? Number(consentTimer) : Infinity;
  const code = posDetail;
  const [discountPercent, setDiscountPercent] = useState(0);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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

  const [changeConsent, setChangeConsent] = useState(false);
  const [consentChangeModal, setConsentChangeModal] = useState(false);
  const [consentTrue, setConsentTrue] = useState(false);
  const [customerDropdown, setCustomerDropdown] = useState(false);

  useEffect(() => {
    setConsentStatus(null);
    setConsentChecked(false);
    setChangeConsent(false);
    setConsentTrue(false);
    consentPromiseRef.current = null;
  }, [email, phone]);

  const twilio = JSON.parse(localStorage.getItem("loginDetail"));
  const twilioRec = twilio?.twilio;

  // ✅ Calculate tax per product globally
  const cartItemsWithTax = useMemo(() => {
    return (
      cartItems?.map((item) => {
        const discountedPrice = item?.product?.discounted_price;
        const specialPrice = item?.product?.special_price || 0;
        const regularPrice =
          item?.product?.price?.regularPrice?.amount?.value ||
          item?.product?.price_range?.minimum_price?.regular_price?.value ||
          0;

        const basePrice = discountedPrice
          ? parseFloat(discountedPrice)
          : specialPrice > 0
          ? specialPrice
          : regularPrice;

        const qty = item?.quantity || 0;
        const rowTotal = basePrice * qty;

        let taxRate = 0;
        let taxAmount = 0;

        if (
          item?.product?.fbr_tax_applied == null ||
          item?.product?.fbr_tax_applied == undefined
        ) {
          taxRate = item?.product?.tax_percent || 0;
          taxAmount = (rowTotal * taxRate) / 100;
        }
        if (item?.product?.fbr_tax_applied == 1) {
          if (payment == "checkmo") {
            taxRate = fbrDetails?.fbr_offline_discount;
          } else {
            taxRate = fbrDetails?.fbr_online_discount;
          }
          if (applyTaxAfterDiscount == 0) {
            taxAmount =
              (item?.product?.special_price && item?.product?.special_price > 0
                ? (item?.product?.special_price * taxRate) / 100
                : (regularPrice * taxRate) / 100) * qty;
          }
          if (applyTaxAfterDiscount == 1) {
            taxAmount = (rowTotal * taxRate) / 100;
          }
          // taxRate = payment == "checkmo" ? fbrDetails?.fbr_offline_discount : fbrDetails?.fbr_online_discount;
        }

        return {
          ...item,
          basePrice,
          rowTotal,
          taxRate,
          taxAmount,
        };
      }) || []
    );
  }, [cartItems, payment]);

  const {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    grandTotal,
    taxRate,
    totalWithoutTax,
  } = useMemo(() => {
    let subtotal = 0;
    let totalTaxAmount = 0;
    let lastTaxRate = 0;

    cartItemsWithTax?.forEach((item) => {
      subtotal += item.rowTotal;
      totalTaxAmount += item.taxAmount;
      lastTaxRate = item.taxRate;
    });

    const discountAmount =
      ((subtotal + totalTaxAmount) * discountPercent) / 100;
    const total = subtotal - discountAmount + totalTaxAmount;
    const totalWithoutTax = subtotal - discountAmount;
    const grandTotal = total + totalTaxAmount;
    return {
      subtotal,
      discountAmount,
      taxAmount: totalTaxAmount,
      total,
      grandTotal,
      taxRate: lastTaxRate,
      totalWithoutTax,
    };
  }, [cartItemsWithTax, discountPercent]);

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

        if (Array.isArray(res) && res.length > 0 && res[0]?.consent) {
          setConsentStatus(res[0].consent);
          setConsentChecked(true);
          setChangeConsent(res?.[0]?.consent == "yes" ? true : false);
          return res[0].consent;
        }

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
      payment,
    };

    const totalDiscount = cartItems.reduce((sum, item) => {
      const product = item?.product;
      const regularPrice = product?.price?.regularPrice?.amount?.value || 0;
      const actualPrice =
        product?.special_price && product?.special_price > 0
          ? product?.special_price
          : regularPrice;
      const discountedPrice = product?.discounted_price || actualPrice;
      const itemDiscount = (actualPrice - discountedPrice) * item.quantity;
      return sum + itemDiscount;
    }, 0);

    const items = cartItems.map((item, index) => {
      const itemWithTax = cartItemsWithTax[index];
      const quantity = item.quantity || 1;
      const discountPercent = item?.product?.pos_discount_percent || 0;

      const priceInclTax =
        itemWithTax.basePrice + itemWithTax.taxAmount / quantity;
      const rowTotalInclTax = itemWithTax.rowTotal + itemWithTax.taxAmount;

      return {
        product_id: item?.product?.id || item?.product?.product_id,
        product_sku: item?.product?.sku || "",
        product_name: item?.product?.name || "",
        price: itemWithTax.basePrice.toFixed(2),
        original_price: (
          item?.product?.price?.regularPrice?.amount?.value || 0
        ).toFixed(2),
        qty: quantity,
        row_total: itemWithTax.rowTotal.toFixed(2),
        discount_percent: discountPercent,
        tax_percent: itemWithTax.taxRate,
        tax_amount: itemWithTax.taxAmount.toFixed(2),
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
      payment_method: payment,
      order_subtotal: subtotal.toFixed(2),
      order_grandtotal: total.toFixed(2),
      discount: discountPercent,
      order_date: new Date().toISOString(),
      fbr_tax_percent:
        payment == "checkmo"
          ? fbrDetails?.fbr_offline_discount
          : fbrDetails?.fbr_online_discount,
      order_tax_amount: taxAmount.toFixed(2),
    };

    try {
      const fbrPayload = {
        InvoiceNumber: orderId,
        POSID: companyDetail?.fbr_pos_id ?? 817377,
        USIN: companyDetail?.usin ?? "USIN0",
        DateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        TotalBillAmount: parseFloat(orderData.order_grandtotal),
        TotalQuantity: cartItemsWithTax.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        TotalSaleValue: parseFloat(orderData.order_subtotal),
        TotalTaxCharged: orderData?.order_tax_amount,
        Discount: parseFloat(totalDiscount),
        FurtherTax: 0.0,
        PaymentMode: payment === "checkmo" ? 1 : 2,
        InvoiceType: 1,
        Items: cartItems.map((item, index) => {
          const product = item?.product;
          const actualPrice =
            product?.special_price && product?.special_price > 0
              ? product?.special_price
              : product?.price?.regularPrice?.amount?.value;
          const itemWithTax = cartItemsWithTax[index];
          const quantity = item.quantity || 1;
          const discountPercent = item?.product?.pos_discount_percent || 0;

          const priceInclTax =
            itemWithTax.basePrice + itemWithTax.taxAmount / quantity;
          const rowTotalInclTax = itemWithTax.rowTotal + itemWithTax.taxAmount;
          return {
            ItemCode: product.sku || "",
            ItemName: product.name || "",
            Quantity: item.quantity,
            PCTCode: companyDetail?.fbr_access_code ?? "CA52C6FC",
            TaxRate: itemWithTax.taxRate,
            SaleValue: actualPrice.toFixed(2),
            TotalAmount: priceInclTax.toFixed(2),
            TaxCharged: (itemWithTax.taxAmount / quantity).toFixed(2),
            Discount: actualPrice - product?.discounted_price || 0.0,
            FurtherTax: 0.0,
            InvoiceType: 1,
          };
        }),
      };
      console.log(fbrPayload);
      try {
        const res = await fetch("/api/fbr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: companyDetail?.fbr_token ?? "123456",
            mode: consentTimerStorage?.pos_mode?.mode,
            ...fbrPayload,
          }),
        });

        const fbrResponse = await res.json();
        console.log("fbr response", fbrResponse);

        if (res.ok && fbrResponse?.InvoiceNumber) {
          orderData.fbr_invoice_id = fbrResponse.InvoiceNumber;
        } else {
          orderData.fbr_invoice_id = null;
          console.error("FBR API error:", fbrResponse);
        }
      } catch (error) {
        console.error("Network error calling FBR:", error);
        orderData.fbr_invoice_id = null;
      }
    } catch (fbrErr) {
      console.error("Error sending FBR record:", fbrErr);
      orderData.fbr_invoice_id = null;
    }

    try {
      let finalConsent = consentStatus;
      if (!finalConsent) finalConsent = "no";

      if (!email && !phone) {
        if (thermalPrint) {
          await printReceipt(
            cartItemsWithTax,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key,
            warehouseId,
            orderData?.fbr_invoice_id
          );
        }
        await saveOrder(orderData);
        await saveOrders(orderData);
        await clearCart();
        setCartItems([]);
        setAmount("");
        setPhone("");
        setEmail("");
        return;
      }

      if (changeConsent != (finalConsent == "yes" ? true : false)) {
        const consentRes = await submitConsentAction({
          increment_id: generateRandomId(),
          customer_email: email,
          phone_number: phone.length ? phone : "",
          consent: "no",
        });
        if (thermalPrint) {
          await printReceipt(
            cartItemsWithTax,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key,
            warehouseId,
            orderData?.fbr_invoice_id
          );
        }
        await saveOrder(orderData);
        await saveOrders(orderData);
        await clearCart();
        setCartItems([]);
        setAmount("");
        setPhone("");
        setEmail("");
        return;
      }

      if (finalConsent === "yes") {
        if (thermalPrint) {
          await printReceipt(
            cartItemsWithTax,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key,
            warehouseId,
            orderData?.fbr_invoice_id
          );
        }
        await saveOrder(orderData);
        await saveOrders(orderData);
        await clearCart();
        setCartItems([]);
        setAmount("");
        setPhone("");
        setEmail("");
      }

      if (finalConsent === "not_set") {
        if (thermalPrint) {
          await printReceipt(
            cartItemsWithTax,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key,
            warehouseId,
            orderData?.fbr_invoice_id
          );
        }
        setConsentModal(true);
        const sessionId = orderData?.increment_id;
        const expiresAt =
          minutes === Infinity ? null : Date.now() + minutes * 60 * 1000;
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
        await saveOrder(orderData);
        await saveOrders(orderData);
        await clearCart();
        setCartItems([]);
        setAmount("");
        setPhone("");
        setEmail("");
      }

      if (finalConsent == "no") {
        if (thermalPrint) {
          await printReceipt(
            cartItemsWithTax,
            total,
            amount,
            balance,
            customerDetails,
            pdfResponse,
            orderId,
            orderData?.order_key,
            warehouseId,
            orderData?.fbr_invoice_id
          );
        }
        await saveOrder(orderData);
        await saveOrders(orderData);
        await clearCart();
        setCartItems([]);
        setAmount("");
        setPhone("");
        setEmail("");
        if (!consentTrue) {
          return;
        }
      }
      console.log("fallback")
      try {
        const delayedJobData = {
          email,
          phone,
          orderId,
          orderData,
          pdfResponse,
          warehouseId,
          smtp_config: decryptedSmtp,
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
                warehouseId: warehouseId,
              }
            : null,
        };

        if (email) {
          delayedJobData.pdfBase64 = await generateReceiptPDF(
            cartItemsWithTax,
            total,
            amount,
            balance,
            customerDetails,
            orderId,
            orderData?.order_key,
            pdfResponse,
            orderData?.fbr_invoice_id
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
          {/* <p>{currencySymbol}{totalWithoutTax.toFixed(2)}</p> */}
        </h2>

        <div className={styles.paymentDetails}>
          <div className={styles.customerDetailsSection}>
            <div
              className={styles.customerDetail}
              onClick={() => setCustomerDropdown((prev) => !prev)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.6667 14V12.6667C10.6667 11.9594 10.3858 11.2811 9.88566 10.781C9.38556 10.281 8.70728 10 8.00004 10H4.00004C3.2928 10 2.61452 10.281 2.11442 10.781C1.61433 11.2811 1.33337 11.9594 1.33337 12.6667V14"
                  stroke="#4A5565"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M10.6666 2.08534C11.2385 2.23359 11.7449 2.56752 12.1064 3.03472C12.4679 3.50192 12.6641 4.07594 12.6641 4.66668C12.6641 5.25742 12.4679 5.83144 12.1064 6.29863C11.7449 6.76583 11.2385 7.09976 10.6666 7.24801"
                  stroke="#4A5565"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M14.6666 14V12.6667C14.6662 12.0758 14.4695 11.5019 14.1075 11.0349C13.7455 10.5679 13.2387 10.2344 12.6666 10.0867"
                  stroke="#4A5565"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6.00004 7.33333C7.4728 7.33333 8.66671 6.13943 8.66671 4.66667C8.66671 3.19391 7.4728 2 6.00004 2C4.52728 2 3.33337 3.19391 3.33337 4.66667C3.33337 6.13943 4.52728 7.33333 6.00004 7.33333Z"
                  stroke="#4A5565"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div className={styles.customerDetailName}>
                <h3 className={styles.sectionTitle}>
                  {serverLanguage?.customer_details ?? "Customer Details"}
                </h3>
                <p>{`${
                  customerDropdown
                    ? "Click to add customer info"
                    : "Click to hide details"
                }`}</p>
              </div>
              {!customerDropdown ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-chevron-down h-4 w-4 text-gray-600"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-chevron-up h-4 w-4 text-gray-600"
                  aria-hidden="true"
                >
                  <path d="m18 15-6-6-6 6"></path>
                </svg>
              )}
            </div>
            {customerDropdown && (
              <div className={styles.customer}>
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
                            onChange={(e) =>
                              handleConsentChange(e.target.checked)
                            }
                          />
                          <span className={styles.customCheck}></span>I do not
                          wish to receive an e-receipt.
                        </label>
                      ) : (
                        <>
                          <p>
                            {"The customer don't want to receive E-Receipts."}
                          </p>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={async () => {
                              setConsentChangeModal(true);
                              setConsentTrue(true);
                              const sessionId = generateRandomId();
                              const expiresAt =
                                minutes === Infinity
                                  ? null
                                  : Date.now() + minutes * 60 * 1000;
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
                    </div>
                  )}
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
                min={0}
                value={discountPercent}
                onChange={(e) => {
                  console.log(parseFloat(e.target.value) || 0);
                  setDiscountPercent(parseFloat(e.target.value) || 0);
                }}
              />
            </div>
          )}

          <div className={styles.paymentDetailBlock}>
            <p className={styles.paymentTitle}>
              {serverLanguage?.payment_type ?? "Payment Type"}:
            </p>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            >
              <option value="checkmo">{serverLanguage?.cash ?? "Cash"}</option>
              <option value="credit">
                {serverLanguage?.credit ?? "Credit"}
              </option>
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
