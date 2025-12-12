"use client";

import React, { useEffect, useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesByCategory({
  categories,
  stores,
  submitSalesByCategoryReport,
  storeCode,
}) {
  const [formData, setFormData] = useState({
    storeId: "",
    categoryName: "",
    period: "day",
    fromDate: "",
    toDate: "",
    orderStatus: "",
    emptyRows: "Yes",
  });

  const [data, setData] = useState({
    items: [],
    totals: null,
    overall_totals: null,
    total_count: 0,
  });

  const [columns, setColumns] = useState([]);
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
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
      storeIds: storeParam,
      showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: "created_at",
      categoryName: formData.categoryName,
    });

    return `${storeCode}/V1/pos/sales-category-report?${params.toString()}`;
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const url = buildUrl(page);

      const response = await submitSalesByCategoryReport(url);
      const json = response?.body?.[0] || {};
      setData({
        items: json?.items || [],
        totals: json?.totals || null,
        overall_totals: json?.overall || null,
        total_count: json?.total_count || 0,
      });

      if (json.items?.length > 0) {
        setColumns(Object.keys(json.items[0]));
      } else if (json.totals) {
        setColumns(
          Object.keys(json.totals).filter((key) => key !== "is_total")
        );
      } else {
        setColumns([]);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  const handlePageChange = (page) => {
    fetchData(page);
  };

  const totalPages = Math.ceil(data.total_count / pageSize);

  const formatColumnLabel = (key) =>
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.endsWith(".0000"))
      return value.split(".")[0];
    return value;
  };

      useEffect(() => {
      if (data.items.length > 0 || data.overall_totals) {
        fetchData(1);
      }
    }, [pageSize]);

const downloadPdf = async () => {
  const storeParam = formData.storeId
    ? formData.storeId
    : stores.map((s) => s.id).join(",");

  const params = new URLSearchParams({
    period: formData.period,
    from: formData.fromDate,
    to: formData.toDate,
    pageSize: "9999", // fetch all
    currentPage: "1",
    storeIds: storeParam,
    showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
    orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
    dateUsed: "created_at",
    categoryName: formData.categoryName,
  });

  const url = `${storeCode}/V1/pos/sales-category-report?${params.toString()}`;
  const response = await submitSalesByCategoryReport(url);
  const json = response?.body?.[0] || {};
  const items = json?.items || [];
  const overall = json?.overall || {};

  if (items.length === 0) {
    alert("No data to export.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Sales by Category Report", 14, 15);

  // Dynamically get all columns from the first row
  const dynamicColumns = Object.keys(items[0] || {});
  const headers = dynamicColumns.map((col) =>
    col
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  const tableData = items.map((item) =>
    dynamicColumns.map((col) => item[col] ?? "-")
  );

  const overallRow = overall
    ? [
        { content: "Overall Totals", colSpan: 1, styles: { fontStyle: "bold" } },
        ...dynamicColumns.slice(1).map((key) => overall[key] ?? "-"),
      ]
    : [];

  autoTable(doc, {
    startY: 20,
    head: [headers],
    body: tableData,
    ...(overallRow.length ? { foot: [overallRow] } : {}),
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
    willDrawCell: function (data) {
      // Bold the overall totals row
      if (overallRow.length && data.row.index === items.length) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save("sales-by-category.pdf");
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
            <label>Category</label>
            <select
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
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
          <h2 className={dashboardTable.title}>Sales by Category</h2>
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
                  <td colSpan={columns.length}>Loading...</td>
                </tr>
              ) : data.items?.length > 0 ? (
                data.items.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {columns.map((col) => (
                      <td key={`${col}-${rowIdx}`}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>No records found.</td>
                </tr>
              )}
            </tbody>
            {data.totals && (
              <tfoot>
                <tr className={dashboardTable.totalsRow}>
                  <td className={dashboardTable.totalLabel}>Totals</td>
                  {columns.slice(1).map((col) => (
                    <td key={`totals-${col}`} className={dashboardTable.total}>
                      {formatValue(data.totals[col])}
                    </td>
                  ))}
                </tr>
                <tr className={dashboardTable.overallTotalsRow}>
                  <td className={dashboardTable.totalLabel}>Overall Totals</td>
                  {columns.slice(1).map((col) => (
                    <td
                      key={`overall-${col}`}
                      className={dashboardTable.overallTotal}
                    >
                      {formatValue(data.overall_totals[col])}
                    </td>
                  ))}
                </tr>
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
