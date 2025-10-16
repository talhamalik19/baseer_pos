"use client";

import React, { useEffect, useState } from "react";
import styles from "./order.module.scss";
import OrderActionModal from "./OrderActionModal";
import {
  printInvoiceAction,
  sendOrderInvoiceAction,
  submitCancelAction,
  submitRefundAction,
} from "@/lib/Magento/actions";
import Link from "next/link";
import { getAllOrders } from "@/lib/indexedDB";
import { usePathname } from "next/navigation";
import { printOrderDetail } from "@/lib/printOrderDetail";
import { printReceipt } from "@/lib/printReceipt";

export default function OrderDetail({ jwt, orderResponse, onBack }) {
  const [order, setOrder] = useState(orderResponse);
  const pathname = usePathname();
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
            data.find((item) => item?.increment_id == pathname?.split("/")?.[2])
          );
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        // setLoading(false);
      }
    }

    fetchOrders();
  }, [order]);

  useEffect(() => {
    // async function getPdf() {
    //   const result = ;
    //   if(result) {
    //     setPdfResponse(result);
    //   }
    // }
    // getPdf();
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

  // Format date
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
    const res = await submitRefundAction(actionData, entity_id, pos_code);
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

  // Add this function to your OrderDetail component

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

    // Calculate cart-level discount automatically
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
    // Open a blank tab immediately — within user click
    const newTab = window.open("about:blank", "_blank");

    try {
      const res = await printInvoiceAction(id);

      if (res?.status === 200 && res?.data?.url) {
        // Redirect the already opened tab to the invoice URL
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
    <div className="page_detail section_padding">
      <div className={styles.pageHeader}>
        <Link href={"/order"} className={styles.backButton}>
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
      <div className={styles.receiptContainer}>
        <div className={styles.totalHeader}>
          <span className={styles.totalHeaderText}>
            Total Price:{" "}
            <span className={styles.totalAmount}>
              ${order.order_grandtotal}
            </span>
          </span>
        </div>
        <div className={styles.totalHeader}>
          <span className={styles.totalHeaderText}>
            Increment ID:{" "}
            <span className={styles.totalAmount}>{order.increment_id}</span>
          </span>
        </div>
        <div className={styles.totalHeader}>
          <span className={styles.totalHeaderText}>
            Order Status:{" "}
            <span className={styles.totalAmount}>{order.order_status}</span>
          </span>
        </div>
        <table className={styles.receiptTable}>
          <tbody>
            {/* First row with order info and totals */}
            <tr className={styles.tableRow}>
              <td className={styles.sectionCell}>
                <table className={styles.innerTable}>
                  <tbody>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Order Date:</td>
                      <td className={styles.valueCell}>
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Location:</td>
                      <td className={styles.valueCell}>
                        {order.shipping_address?.country_id || "N/A"}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Customer:</td>
                      <td className={styles.valueCell}>{`${
                        order.shipping_address?.firstname || ""
                      } ${order.shipping_address?.lastname || ""}`}</td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Email:</td>
                      <td className={styles.valueCell}>
                        {order?.customer_email}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Staff:</td>
                      <td className={styles.valueCell}>Admin</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className={styles.sectionCell}>
                <table className={styles.innerTable}>
                  <tbody>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Subtotal</td>
                      <td className={styles.amountCell}>
                        ${order.subtotal || order.order_grandtotal}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Discount</td>
                      <td className={styles.amountCell}>
                        ${order.discount_amount || "0.00"}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Shipping</td>
                      <td className={styles.amountCell}>
                        ${order.shipping_amount || "0.00"}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Grand Total</td>
                      <td className={styles.amountCell}>
                        ${order.order_grandtotal}
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.labelCell}>Total Paid</td>
                      <td className={styles.amountCell}>
                        ${order.total_paid || order.order_grandtotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr className={styles.tableRow}>
              <td colSpan="2" className={styles.sectionCell}>
                <div className={styles.sectionTitle}>Items Ordered</div>
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
                    const totalAmount = rowTotalInclTax; // price * quantity + tax

                    return (
                      <table key={index} className={styles.innerTable}>
                        <tbody>
                          <tr className={styles.innerTableRow}>
                            <td className={styles.itemDetailsCell}>
                              <span className={styles.itemName}>
                                {item.product_name}
                              </span>
                              <br />
                              <span className={styles.itemSku}>
                                [{item.product_sku}]
                              </span>
                              <br />
                              <span className={styles.itemQuantity}>
                                Ordered: {quantity}
                              </span>
                            </td>
                            <td className={styles.itemPriceCell}>
                              <span className={styles.priceDetail}>
                                Price: ${price.toFixed(2)}
                              </span>
                              <br />
                              <span className={styles.priceDetail}>
                                Tax: ${tax.toFixed(2)}
                              </span>
                              <br />
                              <span className={styles.priceTotal}>
                                Total: ${totalAmount.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })}
              </td>
            </tr>
            {/* Payment and Shipping method row */}
            <tr className={styles.tableRow}>
              <td className={styles.sectionCell}>
                <div className={styles.sectionTitle}>Payment Method</div>
                <table className={styles.innerTable}>
                  <tbody>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.paymentMethodCell}>
                        {order.payment?.method || "Cash"} (
                        {formatDate(order.created_at)})
                      </td>
                    </tr>
                    <tr className={styles.innerTableRow}>
                      <td colSpan="2" className={styles.totalCell}>
                        ${order.order_grandtotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className={styles.sectionCell}>
                <div className={styles.sectionTitle}>Shipping Method</div>
                <table className={styles.innerTable}>
                  <tbody>
                    <tr className={styles.innerTableRow}>
                      <td className={styles.shippingMethodCell}>
                        {order.shipping_description || "Pickup at store"}
                      </td>
                      <td className={styles.amountCell}>
                        ${order.shipping_amount || "0.00"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            {/* Address row */}
            <tr className={styles.tableRow}>
              <td className={styles.sectionCell}>
                <div className={styles.sectionTitle}>Shipping Address</div>
                <div className={styles.addressBox}>
                  <div className={styles.addressLine}>{`${
                    order.shipping_address?.firstname || ""
                  } ${order.shipping_address?.lastname || ""}`}</div>
                  <div className={styles.addressLine}>
                    {order.shipping_address?.street || ""}
                  </div>
                  <div className={styles.addressLine}>
                    {[
                      order.shipping_address?.city,
                      order.shipping_address?.region,
                      order.shipping_address?.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  <div className={styles.addressLine}>
                    {order.shipping_address?.country_id}
                  </div>
                </div>
              </td>
            </tr>
            {/* Button row */}
            <tr className={styles.tableRow}>
              <td colSpan="2" className={styles.actionButtonsRow}>
                {orderResponse?.order_status == "complete" && (
                  <button
                    className={styles.actionButton}
                    onClick={() => openModal("refund")}
                  >
                    Refund
                  </button>
                )}
                {/* <button className={styles.actionButton} onClick={() => openModal('cancel')}>Cancel</button>
                <button className={styles.actionButton}>Email</button> */}
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
              </td>
            </tr>
            <p style={{ color: "#47AF48" }}></p> {responseMessage}
          </tbody>
        </table>
      </div>

      {/* Order Action Modal */}
      <OrderActionModal
        isOpen={modalInfo.isOpen}
        onClose={closeModal}
        order={order}
        actionType={modalInfo.actionType}
        onSubmit={handleActionSubmit}
        styles={styles}
      />
    </div>
  );
}
