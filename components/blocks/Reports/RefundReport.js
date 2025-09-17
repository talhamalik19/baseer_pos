"use client";
import React, { useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RefundReport({
  submitRefundReport,
  storeCode,
  storeIds,
}) {
  const [formData, setFormData] = useState({
    dateUsed: "order",
    period: "day",
    fromDate: "",
    toDate: "",
    orderStatus: "Any",
    emptyRows: "No",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    items: [],
    totals: null,
    overall_totals: null,
    total_count: 0,
  });
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  // Add this new state to track the period used for current data
  const [currentDataPeriod, setCurrentDataPeriod] = useState("");
  const pageSize = 10;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = (page = 1) => {
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
      storeIds: storeIds ?? "1",
      showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: formData.dateUsed,
    });

    return `${storeCode}/V1/pos/sales-refund-report?${params.toString()}`;
  };

  const fetchRefundReport = async (page = 1) => {
    const url = buildUrl(page);
    setLoading(true);
    try {
      const response = await submitRefundReport(url);
      const result = response?.body?.[0];

      const items = result?.items || [];
      const totals = result?.totals || null;
      const overall_totals = result?.overall_totals || null;
      const total_count = result?.total_count || 0;

      setData({ items, totals, overall_totals, total_count });
      
      // Update the current data period when new data is fetched
      setCurrentDataPeriod(formData.period);

      if (items.length > 0) {
        setColumns(Object.keys(items[0]));
      } else if (totals) {
        setColumns(Object.keys(totals).filter((key) => key !== "is_total"));
      } else {
        setColumns([]);
      }

      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading refund report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRefundReport(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    fetchRefundReport(nextPage);
  };

  const formatColumnLabel = (key) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.endsWith(".0000")) {
      return value.split(".")[0];
    }
    return value;
  };

  const totalPages = Math.ceil(data.total_count / pageSize);
  const downloadPdf = async () => {
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      pageSize: "9999", // Fetch all
      currentPage: "1",
      storeIds: storeIds ?? "1",
      showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: formData.dateUsed,
    });

    const url = `${storeCode}/V1/pos/sales-refund-report?${params.toString()}`;
    const response = await submitRefundReport(url);
    const result = response?.body?.[0];

    const items = result?.items || [];
    const overall = result?.overall_totals || null;

    if (items.length === 0) {
      alert("No data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Refund Report", 14, 15);

    // Use all columns dynamically
    const dynamicColumns = Object.keys(items[0]);
    const headers = dynamicColumns.map((col) =>
      col
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );

    const body = items.map((row) =>
      dynamicColumns.map((col) => row[col] ?? "-")
    );

    const overallRow = overall
      ? [
          {
            content: "Overall Totals",
            colSpan: 1,
            styles: { fontStyle: "bold" },
          },
          ...dynamicColumns.slice(1).map((key) => overall[key] ?? "-"),
        ]
      : [];

    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      ...(overallRow.length ? { foot: [overallRow] } : {}),
      styles: { fontSize: 9 },
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

    doc.save("refund-report.pdf");
  };

  return (
    <div className={styles.page_detail}>
      <Link href={"/report"} className={styles.backButton}>
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
            <label>Date Used</label>
            <select
              name="dateUsed"
              value={formData.dateUsed}
              onChange={handleChange}
            >
              <option value="order">Order Created</option>
              <option value="refund">Last Credit Memo Created Date</option>
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
              <option value="month">Month</option>
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
            <p className={styles.info}>
              Applies to Any of the Specified Order Statuses except canceled and
              pending orders
            </p>
          </div>

          <div className={styles.filter_group}>
            <label>Empty Rows</label>
            <select
              name="emptyRows"
              value={formData.emptyRows}
              onChange={handleChange}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
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
          <h2 className={dashboardTable.title}>Refund Report</h2>
        </div>
        {data.items.length > 0 && (
          <button
            type="button"
            onClick={downloadPdf}
            className={styles.export_button}
            style={{ marginBottom: "10px" }}
          >
            Download PDF
          </button>
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
                  <td
                    colSpan={columns.length}
                    className={dashboardTable.loading}
                  >
                    Loading...
                  </td>
                </tr>
              ) : currentDataPeriod === "overall" ? (
                // Show only overall totals row when period is overall
                data.overall_totals ? (
                  <tr className={dashboardTable.overallTotalsRow}>
                    <td className={dashboardTable.totalLabel}>
                      Overall Totals
                    </td>
                    {columns.slice(1).map((key) => (
                      <td
                        key={`overall-${key}`}
                        className={dashboardTable.overallTotal}
                      >
                        {formatValue(data.overall_totals[key])}
                      </td>
                    ))}
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className={dashboardTable.no_records}
                    >
                      No records found.
                    </td>
                  </tr>
                )
              ) : (
                // Show individual records for other periods
                data.items?.length > 0 ? (
                  data.items.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {columns.map((col) => (
                        <td key={`${col}-${rowIdx}`}>
                          {formatValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className={dashboardTable.no_records}
                    >
                      No records found.
                    </td>
                  </tr>
                )
              )}
            </tbody>

            {currentDataPeriod !== "overall" && data.totals && !loading && (
              <tfoot>
                <tr className={dashboardTable.totalsRow}>
                  <td className={dashboardTable.totalLabel}>Period Totals</td>
                  {columns.slice(1).map((key) => (
                    <td key={`total-${key}`} className={dashboardTable.total}>
                      {formatValue(data.totals[key])}
                    </td>
                  ))}
                </tr>
                {data.overall_totals && (
                  <tr className={dashboardTable.overallTotalsRow}>
                    <td className={dashboardTable.totalLabel}>
                      Overall Totals
                    </td>
                    {columns.slice(1).map((key) => (
                      <td
                        key={`overall-${key}`}
                        className={dashboardTable.overallTotal}
                      >
                        {formatValue(data.overall_totals[key])}
                      </td>
                    ))}
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}