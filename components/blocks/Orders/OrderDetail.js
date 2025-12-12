"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./order.module.scss";
import OrderActionModal from "./OrderActionModal";
import {
  printInvoiceAction,
  sendOrderInvoiceAction,
  submitCancelAction,
  submitRefundAction,
} from "@/lib/Magento/actions";
import { getAllOrders } from "@/lib/indexedDB";
import { printOrderDetail } from "@/lib/printOrderDetail";
import { printReceipt } from "@/lib/printReceipt";

export default function OrderDetail({ jwt, orderResponse, onBack, adminId }) {
  const [loginDetail, setLoginDetail] = useState({});
  const [order, setOrder] = useState(orderResponse);
  const location = usePathname();
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    actionType: null,
  });
  const [pdfResponse, setPdfResponse] = useState({});
  const [responseMessage, setResponseMessage] = useState("");
  const warehouseId = JSON.parse(localStorage.getItem("loginDetail"))?.warehouse
    ?.warehouse_id;

  useEffect(() => {
    const detail = JSON.parse(localStorage.getItem("loginDetail")) || {};
    setLoginDetail(detail);
  }, []);
  
  const [email, setEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null) // 'success', 'error', or null

  const [role, setRole] = useState("");

  useEffect(() => {
    const adminRole = localStorage.getItem("role");
    setRole(adminRole);
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getAllOrders();
        if (order == undefined) {
          setOrder(
            data.find(
              (item) => item?.increment_id == location.pathname?.split("/")?.[2]
            )
          );
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }

    fetchOrders();
  }, [order]);

  useEffect(() => {
    if (typeof window !== undefined) {
      const res = JSON.parse(localStorage.getItem("jsonData"));
      setPdfResponse(res);
    }
  }, []);

  if (!order) {
    return (
      <div className="page_detail section_padding">
        Loading order details...
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const openModal = (actionType) => {
    setModalInfo({
      isOpen: true,
      actionType,
    });
  };

  const closeModal = () => {
    setModalInfo({
      isOpen: false,
      actionType: null,
    });
  };

  const getCurrencySymbol = () => {
    const code = order?.invoice?.[0]?.order_currency_code;
    if (!code) return "$";
    return code === "PKR" ? "Rs" : "$";
  };

  const handleActionSubmit = async (actionData, entity_id, pos_code) => {
    const res = await submitRefundAction(actionData, entity_id, pos_code);
    if (res && !res.message) {
      setResponseMessage("Order Refunded Successfully.");
      window.location.reload();
    }
    if (res.message) {
      setResponseMessage(res?.message);
    }
  };

  const handleEmailInvoice = async (id) => {
    setEmail(true)
    setEmailStatus(null)
    setResponseMessage("")
    
    try {
      const res = await sendOrderInvoiceAction(id);
      
      // Check for success
      if (res === true || res?.status === 200) {
        setResponseMessage("Email Sent Successfully");
        setEmailStatus('success')
      } 
      // Check for error status codes
      else if (res?.status === 400) {
        setResponseMessage(res?.message || "Unable to send email");
        setEmailStatus('error')
      }
      else if (res?.status >= 400) {
        setResponseMessage(res?.message || `Unable to send email`);
        setEmailStatus('error')
      }
      // Generic error
      else {
        setResponseMessage(res?.message || "Failed to send email");
        setEmailStatus('error')
      }
      
    } catch (error) {
      console.error("Email error:", error)
      setResponseMessage("An error occurred while sending the email");
      setEmailStatus('error')
    } finally {
      setEmail(false)
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setResponseMessage("")
        setEmailStatus(null)
      }, 5000)
    }
  };

  const handlePrint = () => {
    const order = orderResponse;
    if (!order) return;

    let subtotal = 0;
    let totalTax = 0;
    const currency = getCurrencySymbol();

    const cart = order.items.map((item) => {
      const quantity = parseFloat(item.item_qty_ordered) || 1;
      const rowTotal = parseFloat(item.item_row_total) || 0;
      const rowTotalInclTax =
        parseFloat(item.item_row_total_incl_tax) || rowTotal;
      const taxAmount = rowTotalInclTax - rowTotal;

      subtotal += rowTotal;
      totalTax += taxAmount;

      return {
        addedAt: Date.now(),
        uid: Number(item.item_id),
        quantity,
        selected_options: [],
        product: {
          uid: btoa(item.product_id.toString()),
          id: Number(item.product_id),
          name: item.product_name,
          sku: item.product_sku,
          stock_status: "IN_STOCK",
          apply_discount_on: "both",
          price: {
            regularPrice: {
              amount: { value: parseFloat(item.item_price), currency },
            },
          },
          price_range: {
            minimum_price: {
              final_price: {
                value: parseFloat(item.item_price),
                currency,
              },
            },
          },
          special_price: parseFloat(item.item_price),
          tax_percent: 0,
          pos_discount_percent: 0,
          pos_stock: null,
          is_pos_discount_allowed: null,
          categories: item.category || [],
          image: { url: item.image_url, label: item.product_name },
          thumbnail: { url: item.image_url, label: item.product_name },
          small_image: { url: item.image_url, label: item.product_name },
          custom_price: null,
          custom_attributes: null,
          options: null,
          __typename: "SimpleProduct",
        },
        taxAmount,
      };
    });

    const grandTotal =
      parseFloat(order.order_grandtotal) || subtotal + totalTax;
    const cartDiscount = subtotal + totalTax - grandTotal;

    const totalAmount = grandTotal;
    const amountPaid = totalAmount;
    const balance = 0;

    const customerDetails = {
      name:
        order.customer_firstname && order.customer_lastname
          ? `${order.customer_firstname} ${order.customer_lastname}`
          : `${order.shipping_address?.firstname || ""} ${
              order.shipping_address?.lastname || ""
            }`,
      email: order.customer_email,
      phone: order.shipping_address?.telephone,
      city: order.shipping_address?.city,
      country: order.shipping_address?.country_id,
    };

    printReceipt(
      currency,
      cart,
      totalAmount,
      amountPaid,
      balance,
      customerDetails,
      pdfResponse || null,
      order.increment_id,
      "",
      warehouseId,
      order.fbr_invoice_id || null
    );
  };

  const handlePrintInvoice = async (id) => {
    const newTab = window.open("about:blank", "_blank");

    try {
      const res = await printInvoiceAction(id);

      if (res?.status === 200 && res?.data?.url) {
        newTab.location.href = res.data.url;
      } else {
        newTab.close();
        alert("Failed to generate invoice link.");
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      if (newTab) newTab.close();
      alert("An error occurred while printing the invoice.");
    }
  };

  const currency = getCurrencySymbol();

  return (
    <div className="page_detail">
      <div className={styles.pageWrapper}>
           {responseMessage && (
            <div className={`${styles.responseMessage} ${
              emailStatus === 'success' ? styles.responseSuccess : 
              emailStatus === 'error' ? styles.responseError : ''
            }`}>
              {emailStatus === 'success' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z" fill="currentColor"/>
                </svg>
              )}
              {emailStatus === 'error' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/>
                </svg>
              )}
              <span>{responseMessage}</span>
            </div>
          )}
        <div className={styles.pageHeader}>
          <Link href="/order" className={styles.backButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </Link>
        </div>

        <div className={styles.container}>
          <div className={styles.top_row}>
            <div className={styles.headerInfo}>
              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>Total Price:</span>
                <span className={styles.headerValue}>
                  {currency}
                  {parseFloat(order.order_grandtotal).toFixed(2)}
                </span>
              </div>

              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>Increment ID:</span>
                <span className={styles.headerValue}>
                  {order.increment_id}
                </span>
              </div>

              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>Order Status:</span>
                <span className={styles.headerValue}>
                  {order.order_status}
                </span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              {role == "super_admin" &&
                loginDetail?.admin_acl?.orders_refund &&
                orderResponse?.order_status == "complete" && (
                  <button
                    className={styles.actionButton}
                    onClick={() => openModal("refund")}
                  >
                    Refund / Return
                  </button>
                )}

              <button className={styles.actionButton} onClick={handlePrint}>
                Print
              </button>

              <button
                className={styles.actionButton}
                onClick={() =>
                  handlePrintInvoice(orderResponse?.invoice?.[0]?.invoice_id)
                }
              >
                Download Invoice
              </button>
              <button
                className={`${styles.actionButton} ${email ? styles.loading_action : ''}`}
                onClick={() =>
                  handleEmailInvoice(orderResponse?.invoice?.[0]?.invoice_id)
                }
                disabled={email}
              >
                {email ? 'Sending...' : 'Email Invoice'}
              </button>
             
            </div>
          </div>

          <div className={styles.twoColumnGrid}>
            <div className={styles.card}>
              <div className={styles.cardRow}>
                <div className={styles.cardColumn}>
                  <span className={styles.cardLabel}>Order Date:</span>
                  <span className={styles.cardValue}>
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <div className={styles.cardColumn}>
                  <span className={styles.cardLabel}>Location:</span>
                  <span className={styles.cardValue}>
                    {order.shipping_address?.country_id || "N/A"}
                  </span>
                </div>
              </div>

              <div className={styles.cardRow}>
                <div className={styles.cardColumn}>
                  <span className={styles.cardLabel}>Customer:</span>
                  <span className={styles.cardValue}>
                    {`${order.shipping_address?.firstname || ""} ${
                      order.shipping_address?.lastname || ""
                    }`}
                  </span>
                </div>

                <div className={styles.cardColumn}>
                  <span className={styles.cardLabel}>Email:</span>
                  <span className={styles.cardValue}>
                    {order?.customer_email}
                  </span>
                </div>
              </div>

              <div className={styles.cardColumn}>
                <span className={styles.cardLabel}>Staff:</span>
                <span className={styles.cardValue}>Admin</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.totalCard}`}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Subtotal</span>
                <span className={styles.cardValue}>
                  {currency}
                  {parseFloat(
                    order.subtotal || order.order_grandtotal
                  ).toFixed(2)}
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Discount</span>
                <span className={styles.cardValue}>
                  {currency}
                  {parseFloat(order.discount_amount || 0).toFixed(2)}
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Shipping</span>
                <span className={styles.cardValue}>
                  {currency}
                  {parseFloat(order.shipping_amount || 0).toFixed(2)}
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Grand Total</span>
                <span className={styles.cardValue}>
                  {currency}
                  {parseFloat(order.order_grandtotal).toFixed(2)}
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Total Paid</span>
                <span className={styles.cardValue}>
                  {currency}
                  {parseFloat(
                    order.total_paid || order.order_grandtotal
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className={styles.twoColumnGrid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Items Ordered</h3>

              {order.items &&
                order.items.map((item, index) => {
                  const quantity =
                    item.item_qty_ordered || item?.qty || 1;
                  const price = parseFloat(
                    item.item_price || item?.base_price || 0
                  );
                  const rowTotal = parseFloat(
                    item.item_row_total || 0
                  );
                  const rowTotalInclTax = parseFloat(
                    item.item_row_total_incl_tax || rowTotal
                  );
                  const tax = rowTotalInclTax - rowTotal;
                  const totalAmount = rowTotalInclTax;
                  const refunded = item?.qty_refunded;

                  return (
                    <div
                      key={index}
                      className={styles.itemsContainer}
                    >
                      <div className={styles.itemLeft}>
                        <div className={styles.itemName}>
                          {item.product_name}
                        </div>

                        <div className={styles.itemSku}>
                          ({item.product_sku})
                        </div>

                        <div className={styles.itemQuantity}>
                          Ordered: {parseFloat(quantity).toFixed(2)}
                        </div>

                        {refunded > 0 && (
                          <div className={styles.itemQuantity}>
                            Refunded:{" "}
                            {parseFloat(refunded).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className={styles.itemRight}>
                        <div className={styles.itemPrice}>
                          Price: {currency}
                          {price.toFixed(2)}
                        </div>

                        <div className={styles.itemTax}>
                          Tax: {currency}
                          {tax.toFixed(2)}
                        </div>

                        <div className={styles.itemTotal}>
                          Total: {currency}
                          {totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Payment Method</h3>

                <div className={styles.methodInfo}>
                  <div className={styles.methodText}>
                    {order.payment?.method || "Cash"} (
                    {formatDate(order.created_at)})
                  </div>

                  <div className={styles.methodAmount}>
                    {currency}
                    {parseFloat(order.order_grandtotal).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SHIPPING */}
          <div className={styles.twoColumnGrid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Shipping Method</h3>

              <div className={styles.cardRow}>
                <div className={styles.methodText}>
                  {order.shipping_description ||
                    "Pickup at store"}
                </div>

                <div className={styles.methodAmount}>
                  {currency}
                  {parseFloat(
                    order.shipping_amount || 0
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          <div
            className={`${styles.twoColumnGrid} ${styles.shipping}`}
          >
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Shipping Address
              </h3>

              <div className={styles.addressContent}>
                <div>{`${order.shipping_address?.firstname || ""} ${
                  order.shipping_address?.lastname || ""
                }`}</div>

                <div>{order.shipping_address?.street || ""}</div>

                <div>
                  {[
                    order.shipping_address?.city,
                    order.shipping_address?.region,
                    order.shipping_address?.postcode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>

                <div>{order.shipping_address?.country_id}</div>
              </div>
            </div>
          </div>

        </div>

        <OrderActionModal
          isOpen={modalInfo.isOpen}
          onClose={closeModal}
          order={order}
          actionType={modalInfo.actionType}
          onSubmit={handleActionSubmit}
          styles={styles}
          adminId={adminId}
        />
      </div>
    </div>
  );
}