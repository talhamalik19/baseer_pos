"use client";

import React, { useEffect, useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesByPaymentReport({
  submitSalesReport,
  storeCode,
  stores,
}) {
  const [formData, setFormData] = useState({
    storeId: "",
    period: "day",
    fromDate: "",
    toDate: "",
    orderStatus: "Any",
    dateUsed: "created_at",
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
  const [pageSize, setPageSize] = useState(10);

  const buildUrl = (page = 1) => {
    const storeParam = formData.storeId
      ? formData.storeId
      : stores.map((s) => s.id).join(",");
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
      storeIds: storeParam,
      showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: formData.dateUsed,
    });

    return `${storeCode}/V1/pos/sales-payment-type-report?${params.toString()}`;
  };

  const fetchSalesReport = async (page = 1) => {
    setLoading(true);
    try {
      const url = buildUrl(page);
      const response = await submitSalesReport(url);
      const json = response?.body?.[0] || {};
      const paymentMethods = Object.values(json.payment_methods || {});
      const totals = json.page_totals || null;
      const overallTotals = json.overall_totals || null;
      const totalCount = json?.total_methods;

      setData({
        items: paymentMethods,
        totals,
        overall_totals: overallTotals,
        total_count: totalCount,
      });

      if (paymentMethods.length > 0) {
        setColumns(Object.keys(paymentMethods[0]));
      } else if (totals) {
        setColumns(Object.keys(totals).filter((key) => key !== "is_total"));
      } else {
        setColumns([]);
      }

      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading payment type report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchSalesReport(1);
  };

  const handlePageChange = (page) => {
    fetchSalesReport(page);
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

        useEffect(() => {
      if (data.items.length > 0 || data.overall_totals) {
        fetchSalesReport(1);
      }
    }, [pageSize]);
const downloadPdf = async () => {
  const storeParam = formData.storeId ? formData.storeId : stores.map(s => s.id).join(",");
  const params = new URLSearchParams({
    period: formData.period,
    from: formData.fromDate,
    to: formData.toDate,
    pageSize: "9999", // Get all records
    currentPage: "1",
    storeIds: storeParam,
    showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
    orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
    dateUsed: formData.dateUsed,
  });

  const url = `${storeCode}/V1/pos/sales-payment-type-report?${params.toString()}`;
  const response = await submitSalesReport(url);
  const json = response?.body?.[0] || {};

  const paymentMethods = Object.values(json.payment_methods || {});
  const overall = json.overall_totals || {};

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Sales by Payment Method Report", 14, 15);

  const headers = [
    "Date",
    "Payment Method",
    "Orders",
    "Items",
    "Gross",
    "Refunded",
    "Net",
    "Avg Order",
    "% of Total",
  ];

  const tableData = paymentMethods.map((item) => [
    item.period,
    item.label,
    item.orders,
    item.items,
    item.gross,
    item.refunded,
    item.net,
    item.average_order_value,
    item.percentage_of_total,
  ]);

  // Add overall totals row
  const overallRow = [
    { content: "Overall Totals", colSpan: 2, styles: { fontStyle: "bold" } },
    formatValue(overall.orders),
    formatValue(overall.items),
    formatValue(overall.gross),
    formatValue(overall.refunded),
    formatValue(overall.net),
    formatValue(overall.average_order_value),
    formatValue(overall.percentage_of_total),
  ];

  autoTable(doc, {
    startY: 20,
    head: [headers],
    body: tableData,
    foot: [overallRow],
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

  doc.save("sales-by-payment-method.pdf");
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
          <h2 className={dashboardTable.title}>Sales by Payment Method</h2>
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
                  <td
                    colSpan={columns.length}
                    className={dashboardTable.no_records}
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>

            {data.totals && (
              <tfoot>
                <tr className={dashboardTable.totalsRow}>
                  <td className={dashboardTable.totalLabel}>Page Totals</td>
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

        {
          <div className={styles.pagination}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}

          totalItems={data?.total_count}
               pageSize={pageSize}
  setPageSize={setPageSize} 
            />
          </div>
        }
      </div>
    </div>
  );
}
