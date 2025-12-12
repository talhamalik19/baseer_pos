"use client";

import React, { useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function WorstSellerReport({
  submitWorstSellerReport,
  storeCode,
  stores,
}) {
  const [formData, setFormData] = useState({
    storeId: "",
    period: "day",
    fromDate: "",
    toDate: "",
    orderStatus: "",
    limit: 4,
  });

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = () => {
    const storeParam = formData.storeId || stores.map((s) => s.id).join(",");
    const params = new URLSearchParams({
      period: formData.period,
      storeIds: storeParam,
      from: formData.fromDate,
      to: formData.toDate,
      orderStatuses: formData.orderStatus,
      dateUsed: "created_at",
      limit: 5,
    });
    return `${storeCode}/V1/pos/worstsellerreport?${params.toString()}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = buildUrl();
      const response = await submitWorstSellerReport(url);
      const groupedItems = response?.body?.[0]?.items || {};

      const allRecords = Object.entries(groupedItems).flatMap(([date, items]) =>
        items.map((item) => ({ ...item, date }))
      );

      setData(allRecords);

      if (allRecords.length > 0) {
        setColumns([
          "date",
          ...Object.keys(allRecords[0]).filter((k) => k !== "date"),
        ]);
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error("Error loading report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const formatLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const formatValue = (val) => (val === null || val === undefined ? "-" : val);

const downloadPdf = () => {
  if (!data?.length) {
    alert("No data to export");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Worst Seller Report", 14, 15);

  // Get all keys dynamically from first item
  const dynamicColumns = Object.keys(data[0]);
  const headers = dynamicColumns.map((col) =>
    col
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  const tableData = data.map((item) =>
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

  doc.save("worst-seller-report.pdf");
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
        </svg>
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
            <label>Period</label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
            >
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
          <button type="submit" className={styles.export_button}>
            Run Report
          </button>
        </div>
      </form>

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>Worst Seller Report</h2>
        </div>
          {data.length > 0 && (
            <button
              onClick={downloadPdf}
              className={styles.export_button}
              style={{ marginTop: 10 }}
            >
              Download PDF
            </button>
          )}

        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{formatLabel(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length}>Loading...</td>
                </tr>
              ) : data.length > 0 ? (
                data.map((row, idx) => (
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
