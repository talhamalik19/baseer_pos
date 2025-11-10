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

export default function OrderDetail({ jwt, orderResponse, onBack }) {
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
    async function fetchOrders() {
      try {
        const data = await getAllOrders();
        if (order == undefined) {
          setOrder(
            data.find((item) => item?.increment_id == location.pathname?.split("/")?.[2])
          );
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }

    fetchOrders();
  }, [order]);

  useEffect(() => {
    if (typeof window != undefined) {
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

  const handleActionSubmit = async (actionData, entity_id, pos_code) => {
    console.log(actionData, entity_id, pos_code)
    const res = await submitRefundAction(actionData, entity_id, pos_code);
    console.log(res)
    if (res && !res.message) {
      setResponseMessage("Order Refunded Successfully.");
    }
    if (res.message) {
      setResponseMessage(res?.message);
    }
  };

  const handleEmailInvoice = async (id) => {
    const res = await sendOrderInvoiceAction(id);
    if (res == true) {
      setResponseMessage("Email Sent");
    } else {
      setResponseMessage(res?.message);
    }
  };

  const handlePrint = () => {
    const order = orderResponse;
    if (!order) return;

    let subtotal = 0;
    let totalTax = 0;

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
              amount: { value: parseFloat(item.item_price), currency: "PKR" },
            },
          },
          price_range: {
            minimum_price: {
              final_price: {
                value: parseFloat(item.item_price),
                currency: "PKR",
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

  return (
    <div className="page_detail">
    <div className={styles.pageWrapper}>
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
        {/* Header Info */}
        <div className={styles.headerInfo}>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Total Price:</span>
            <span className={styles.headerValue}>${order.order_grandtotal}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Increment ID:</span>
            <span className={styles.headerValue}>{order.increment_id}</span>
          </div>
          <div className={styles.headerItem}>
            <span className={styles.headerLabel}>Order Status:</span>
            <span className={styles.headerValue}>{order.order_status}</span>
          </div>
        </div>

        {/* Order Info and Totals */}
        <div className={styles.twoColumnGrid}>
          <div className={styles.card}>
            <div className={styles.cardRow}>
            <div className={styles.cardColumn}>
              <span className={styles.cardLabel}>Order Date:</span>
              <span className={styles.cardValue}>{formatDate(order.created_at)}</span>
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
              <span className={styles.cardValue}>{`${
                order.shipping_address?.firstname || ""
              } ${order.shipping_address?.lastname || ""}`}</span>
            </div>
            <div className={styles.cardColumn}>
              <span className={styles.cardLabel}>Email:</span>
              <span className={styles.cardValue}>{order?.customer_email}</span>
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
                ${order.subtotal || order.order_grandtotal}
              </span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Discount</span>
              <span className={styles.cardValue}>
                ${order.discount_amount || "0.00"}
              </span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Shipping</span>
              <span className={styles.cardValue}>
                ${order.shipping_amount || "0.00"}
              </span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Grand Total</span>
              <span className={styles.cardValue}>${order.order_grandtotal}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>Total Paid</span>
              <span className={styles.cardValue}>
                ${order.total_paid || order.order_grandtotal}
              </span>
            </div>
          </div>
        </div>

        {/* Items Ordered */}
        <div className={styles.twoColumnGrid}>
          <div className={styles.card}>
          <h3 className={styles.cardTitle}>Items Ordered</h3>
          {order.items &&
            order.items.map((item, index) => {
              const quantity = item.item_qty_ordered || item?.qty || 1;
              const price = parseFloat(
                item.item_price || item?.base_price || 0
              );
              const rowTotal = parseFloat(item.item_row_total || 0);
              const rowTotalInclTax = parseFloat(
                item.item_row_total_incl_tax || rowTotal
              );
              const tax = rowTotalInclTax - rowTotal;
              const totalAmount = rowTotalInclTax;

              return (
                <div key={index} className={styles.itemsContainer}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemName}>{item.product_name}</div>
                    <div className={styles.itemSku}>({item.product_sku})</div>
                    <div className={styles.itemQuantity}>Ordered: {quantity}</div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.itemPrice}>Price: ${price.toFixed(2)}</div>
                    <div className={styles.itemTax}>Tax: ${tax.toFixed(2)}</div>
                    <div className={styles.itemTotal}>Total: ${totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
            </div>
 <div className={styles.card}>
            <h3 className={styles.cardTitle}>Payment Method</h3>
            <div className={styles.methodInfo}>
              <div className={styles.methodText}>
                {order.payment?.method || "Cash"} ({formatDate(order.created_at)})
              </div>
              <div className={styles.methodAmount}>${order.order_grandtotal}</div>
            </div>
          </div>
        </div>

        {/* Payment and Shipping */}
        {/* <div className={styles.twoColumnGrid}> */}
         

          <div className={styles.twoColumnGrid}>
            <div className={styles.card}>
            <h3 className={styles.cardTitle}>Shipping Method</h3>
            <div className={styles.cardRow}>
              <div className={styles.methodText}>
                {order.shipping_description || "Pickup at store"}
              </div>
              <div className={styles.methodAmount}>
                ${order.shipping_amount || "0.00"}
              </div>
            </div>
            </div>
          </div>
        {/* </div> */}

        {/* Shipping Address */}
        <div className={`${styles.twoColumnGrid} ${styles.shipping}`}>
          <div className={styles.card}>
          <h3 className={styles.cardTitle}>Shipping Address</h3>
          <div className={styles.addressContent}>
            <div>{`${
              order.shipping_address?.firstname || ""
            } ${order.shipping_address?.lastname || ""}`}</div>
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

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {orderResponse?.order_status == "complete" && (
            <button
              className={styles.actionButton}
              onClick={() => openModal("refund")}
            >
              Refund
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
            className={`${styles.actionButton} loading_action`}
            onClick={() =>
              handleEmailInvoice(orderResponse?.invoice?.[0]?.invoice_id)
            }
          >
            Email Invoice
          </button>
        </div>

        {responseMessage && (
          <p className={styles.responseMessage}>{responseMessage}</p>
        )}
      </div>

      <OrderActionModal
        isOpen={modalInfo.isOpen}
        onClose={closeModal}
        order={order}
        actionType={modalInfo.actionType}
        onSubmit={handleActionSubmit}
        styles={styles}
      />
    </div>
    </div>
  );
}
