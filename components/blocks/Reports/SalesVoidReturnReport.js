"use client";

import React, { useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesVoidReturnReport({
  submitSalesVoidReturnReport,
  storeCode,
  stores,
}) {
  const [formData, setFormData] = useState({
    period: "day",
    fromDate: "",
    toDate: "",
    storeId: stores?.[0]?.id || "",
    orderStatus: "Any",
    returnReason: "",
    adminUser: "",
    posCode: "",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const buildUrl = () => {
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      storeIds: formData.storeId,
      pageSize: "50",
      currentPage: "1",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: "created_at",
      returnReason: formData.returnReason,
      adminUser: formData.adminUser,
      posCode: formData.posCode,
    });
    return `${storeCode}/V1/pos/sales-void-return-report?${params.toString()}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = buildUrl();
      const response = await submitSalesVoidReturnReport(url);
      setData(response?.body?.[0]?.results || []);
    } catch (err) {
      console.error("Error loading sales void return report:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!data.length) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Sales Void Return Report", 14, 15);

    const headers = ["Date", "Total Refunded Qty", "Total Order Qty", "Amount"];

    const tableData = data.map((entry) => [
      entry.period,
      entry.totals?.refunded_qty ?? "-",
      entry.totals?.order_qty ?? "-",
      entry.totals?.amount ?? "-",
    ]);

    autoTable(doc, {
      startY: 22,
      head: [headers],
      body: tableData,
      styles: { fontSize: 10 },
         headStyles: {
    fillColor: [35, 35, 35], // Header background color
    textColor: [255, 255, 255], // Optional: white text for better contrast
  },
  footStyles: {
    fontStyle: "bold",
    fillColor: [35, 35, 35], // Footer background color
    textColor: [255, 255, 255], // Optional: white text
  },
      theme: "grid",
    });

    doc.save("sales-void-return-report.pdf");
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
            <label>Period</label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="quarter">Quarter</option>
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

          <div className={styles.filter_group}>
            <label>Return Reason</label>
            <input
              type="text"
              name="returnReason"
              value={formData.returnReason}
              onChange={handleChange}
            />
          </div>

          <div className={styles.filter_group}>
            <label>Admin User</label>
            <input
              type="text"
              name="adminUser"
              value={formData.adminUser}
              onChange={handleChange}
            />
          </div>

          <div className={styles.filter_group}>
            <label>POS Code</label>
            <input
              type="text"
              name="posCode"
              value={formData.posCode}
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
          <h2 className={dashboardTable.title}>Sales Void Return Report</h2>
        </div>
        {data.length > 0 && (
          <button
            type="button"
            onClick={downloadPdf}
            className={styles.export_button}
            style={{ marginTop: "10px" }}
          >
            Download PDF
          </button>
        )}

        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Refunded Qty</th>
                <th>Total Order Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Loading...</td>
                </tr>
              ) : data.length > 0 ? (
                data.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.period}</td>
                    <td>{entry.totals?.refunded_qty}</td>
                    <td>{entry.totals?.order_qty}</td>
                    <td>{entry.totals?.amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
