"use client";

import React, { useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesByItem({
  submitSalesByItemReport,
  storeCode,
  products,
  stores
}) {
  const [formData, setFormData] = useState({
    identifier: "",
    storeId: "",
    period: "year",
    fromDate: "",
    toDate: "",
    orderStatus: "",
  });

  const [data, setData] = useState({ items: [], product: null });
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = () => {
    const storeParam = formData.storeId ? formData.storeId : stores.map(s => s.id).join(",");
    const params = new URLSearchParams({
      period: formData.period,
      identifier: formData.identifier,
      storeIds: storeParam,
      from: formData.fromDate,
      to: formData.toDate,
      orderStatus: formData.orderStatus,
      dateUsed: "created_at"
    });

    return `${storeCode}/V1/pos/single-item-report?${params.toString()}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = buildUrl();
      const response = await submitSalesByItemReport(url);
      const res = response?.body?.[0] || {};

      setData({
        items: res?.items || [],
        product: res?.product || null
      });

      if (res?.items?.length > 0) {
        setColumns(Object.keys(res.items[0]));
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error("Error loading item report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const formatColumnLabel = (key) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.endsWith(".0000")) return value.split(".")[0];
    return value;
  };

const downloadPdf = () => {
  if (!data.items.length) return;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Sales by Item Report", 14, 15);

  if (data.product) {
    doc.setFontSize(11);
    doc.text(`Product: ${data.product.name} (SKU: ${data.product.sku})`, 14, 22);
  }

  // Dynamically get all columns from first item
  const dynamicColumns = Object.keys(data.items[0] || {});
  const headers = dynamicColumns.map((col) =>
    col
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  const tableData = data.items.map((item) =>
    dynamicColumns.map((col) => item[col] ?? "-")
  );

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [35, 35, 35],
      textColor: [255, 255, 255],
    },
    footStyles: {
      fontStyle: "bold",
      fillColor: [35, 35, 35],
      textColor: [255, 255, 255],
    },
    theme: "grid",
  });

  doc.save("sales-by-item.pdf");
};


  return (
    <div className={styles.page_detail}>
      <Link href="/report" className={styles.backButton}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reports
      </Link>

      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}><span>Filter</span></div>

        <div className={styles.filter_grid}>
          <div className={styles.filter_group}>
            <label>Store</label>
            <select name="storeId" value={formData.storeId} onChange={handleChange}>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.store_name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filter_group}>
            <label>Product</label>
            <select name="identifier" value={formData.identifier} onChange={handleChange} required>
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filter_group}>
            <label>Period</label>
            <select name="period" value={formData.period} onChange={handleChange}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="quarter">Quarter</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="overall">Overall</option>
            </select>
          </div>

          <div className={styles.filter_group}>
            <label>From *</label>
            <input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} required />
          </div>

          <div className={styles.filter_group}>
            <label>To *</label>
            <input type="date" name="toDate" value={formData.toDate} onChange={handleChange} required />
          </div>

          <div className={styles.filter_group}>
            <label>Order Status</label>
           <select
              name="orderStatus"
              value={formData.orderStatus}
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
        </div>

        <div className={styles.filter_footer}>
          <button type="submit" className={styles.export_button}>Run Report</button>
        </div>
      </form>

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>Sales by Item</h2>
          {data.product && (
            <p className={dashboardTable.subtitle}>Product: {data.product.name} (SKU: {data.product.sku})</p>
          )}
        </div>
  {data.product && (
    <>
      <p className={dashboardTable.subtitle}>
        Product: {data.product.name} (SKU: {data.product.sku})
      </p>
      {data.items.length > 0 && (
        <button
          type="button"
          onClick={downloadPdf}
          className={styles.export_button}
          style={{ marginTop: "10px" }}
        >
          Download PDF
        </button>
      )}
    </>
  )}
        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{formatColumnLabel(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length}>Loading...</td>
                </tr>
              ) : data.items.length > 0 ? (
                data.items.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={`${col}-${idx}`}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
