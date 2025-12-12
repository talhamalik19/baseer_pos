// components/blocks/Reports/SalesTransactionDetailReport.jsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesTransactionDetailReport({
  submitSalesTransactionReport,
  storeCode,
  stores,
}) {
  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    orderStatuses: "",
    storeId: "",
    dateUsed: "created_at",
    sku: "",
    customerEmail: "",
    orderIncrementId: "",
  });

  const [data, setData] = useState({
    orders: [],
    summary: null,
    pagination: null,
  });

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = (page = 1) => {
    const storeParam = formData.storeId
      ? formData.storeId
      : stores.map((s) => s.id).join(",");
    const statusParam =
      formData.orderStatuses === "Any" ? "" : formData.orderStatuses;
    const params = new URLSearchParams({
      from: formData.fromDate,
      to: formData.toDate,
      storeIds: storeParam,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
      orderStatuses: statusParam,
      dateUsed: formData.dateUsed,
      sku: formData.sku,
      customerEmail: formData.customerEmail,
      orderIncrementId: formData.orderIncrementId,
    });
    return `${storeCode}/V1/pos/sales-transaction-detail-report?${params.toString()}`;
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const url = buildUrl(page);
      const response = await submitSalesTransactionReport(url);
      const [orders, summary, range, filters, pagination] = response?.body || [
        [],
        null,
        null,
        null,
        null,
      ];
      setData({ orders, summary, pagination });
      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading transaction detail report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  const handlePageChange = (page) => {
    if (page < 1) return;
    fetchData(page);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    return value;
  };

  const fetchAllOrders = async () => {
  const storeParam = formData.storeId
    ? formData.storeId
    : stores.map((s) => s.id).join(",");
  const statusParam =
    formData.orderStatuses === "Any" ? "" : formData.orderStatuses;

  const params = new URLSearchParams({
    from: formData.fromDate,
    to: formData.toDate,
    storeIds: storeParam,
    pageSize: "999", // max
    currentPage: "1",
    orderStatuses: statusParam,
    dateUsed: formData.dateUsed,
    sku: formData.sku,
    customerEmail: formData.customerEmail,
    orderIncrementId: formData.orderIncrementId,
  });

  const url = `${storeCode}/V1/pos/sales-transaction-detail-report?${params.toString()}`;
  const response = await submitSalesTransactionReport(url);
  const [orders] = response?.body || [[]];
  return orders;
};

  useEffect(() => {
        fetchData(1);
    }, [pageSize]);

const downloadPdf = async () => {
  const allOrders = await fetchAllOrders();

  if (!allOrders.length) return;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Sales Transaction Detail Report", 14, 15);

  const headers = [
    "Order ID",
    "Date",
    "Status",
    "Phone",
    "Payment Method",
    "Grand Total",
    "Items",
  ];

  const rows = allOrders.map((order) => [
    order.order_id || "-",
    order.date || "-",
    order.status || "-",
    order.customer?.phone || "-",
    order.payment?.additional_info?.method_title || "-",
    order.totals?.grand_total || "-",
    order.items
      .map(
        (item) => `${item.name} (x${item.qty_ordered}) - $${item.row_total}`
      )
      .join(", "),
  ]);

  autoTable(doc, {
    startY: 22,
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
      headStyles: {
    fillColor: [35, 35, 35], // Header background color
    textColor: [255, 255, 255], // Optional: white text for better contrast
  },
  footStyles: {
    fontStyle: "bold",
    fillColor: [35, 35, 35], // Footer background color
    textColor: [255, 255, 255], // Optional: white text
  },
    columnStyles: {
      8: { cellWidth: 60 },
    },
    theme: "grid",
  });

  doc.save("sales-transaction-detail-report.pdf");
};

  return (
    <div className={styles.page_detail}>
      <Link href="/report" className={styles.backButton}>
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
        </svg>{" "}
        Back to Reports
      </Link>

      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>Filter</span>
        </div>
        <div className={styles.filter_grid}>
          <div className={styles.filter_group}>
            <label>Store</label>
            <select
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filter_group}>
            <label>From *</label>
            <input
              type="date"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.filter_group}>
            <label>To *</label>
            <input
              type="date"
              name="toDate"
              value={formData.toDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.filter_group}>
            <label>Order Status</label>
            <select
              name="orderStatuses"
              value={formData.orderStatuses}
              onChange={handleChange}
            >
              <option value="Any">Any</option>
              <option value="pending">Pending</option>
              <option value="complete">Completed</option>
               <option value="processing">Processing</option>
                <option value="canceled">Canceled</option>
              <option value="closed">Closed</option>
               <option value="holded">On Hold</option>
            </select>
          </div>

          <div className={styles.filter_group}>
            <label>SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
            />
          </div>

          <div className={styles.filter_group}>
            <label>Customer Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
            />
          </div>

          <div className={styles.filter_group}>
            <label>Order ID</label>
            <input
              type="text"
              name="orderIncrementId"
              value={formData.orderIncrementId}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className={styles.filter_footer}>
          <button type="submit" className={styles.export_button}>
            Run Report
          </button>
        </div>
      </form>

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>
            Sales Transaction Detail Report
          </h2>
        </div>
        {data.orders.length > 0 && (
          <button
            type="button"
            onClick={downloadPdf}
            className={styles.export_button}
            style={{ marginTop: "10px" }}
          >
            Download PDF
          </button>
        )}
        <div className={`${dashboardTable.table_block} ${styles.table_report_block}`}>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Payment Method</th>
                <th>Grand Total</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading...</td>
                </tr>
              ) : data.orders.length > 0 ? (
                data.orders.map((order, index) => (
                  <tr key={index}>
                    <td>{formatValue(order.order_id)}</td>
                    <td>{formatValue(order.date)}</td>
                    <td>{formatValue(order.status)}</td>
                    <td>{formatValue(order.customer?.name ?? "Guest")}</td>
                    <td>{formatValue(order.customer?.email)}</td>
                    <td>{formatValue(order.customer?.phone)}</td>
                    <td>
                      {formatValue(
                        order.payment?.additional_info?.method_title
                      )}
                    </td>
                    <td>{formatValue(order.totals?.grand_total)}</td>
                    <td>
                      <ul>
                        {order.items.map((item, i) => (
                          <li key={i}>
                            {item.name} (x{item.qty_ordered}) - 
                            {item.row_total}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.pagination && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(data.pagination.total_orders / pageSize)}
            onPageChange={handlePageChange}

          totalItems={data?.pagination.total_orders}
               pageSize={pageSize}
  setPageSize={setPageSize} 
          />
        )}
      </div>
    </div>
  );
}
