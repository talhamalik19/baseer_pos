"use client";
import React, { useEffect, useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAllEmployees } from "@/lib/indexedDB";

export default function SalesByAdminReport({
  submitSalesAdminReport,
  storeCode,
  storeIds,
  stores,
  adminUser,
  employeesResult,
  username
}) {
  const storeOptions = storeIds
    ? storeIds.split(",").map((id) => id.trim())
    : [];
  const [loginDetail, setLoginDetail] = useState()

  useEffect(()=>{
    const local = JSON.parse(localStorage.getItem("loginDetail"))
    setLoginDetail(local)
  }, [])

  const [formData, setFormData] = useState({
    dateUsed: "order",
    period: "day",
    fromDate: "",
    toDate: "",
    orderStatus: "Any",
    emptyRows: "No",
    storeId: storeOptions[0] || "",
    adminUser: adminUser || "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    items: [],
    overall_totals: null,
    total_count: 0,
  });

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDataPeriod, setCurrentDataPeriod] = useState("");
  const [pageSize, setPageSize] = useState(10);

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
      storeIds: formData.storeId || "",
      showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: formData.dateUsed,
      adminUser: formData.adminUser || "",
    });

    return `${storeCode}/V1/pos/sales-admin-report?${params.toString()}`;
  };

  const fetchSalesAdminReport = async (page = 1) => {
    const url = buildUrl(page);
    setLoading(true);

    try {
      const response = await submitSalesAdminReport(url);
      const result = response?.body?.[0] || {};

      const items = result?.items || [];
      const overall_totals = result?.overall_totals || null;
      const total_count = result?.total_count || 0;

      setData({ items, overall_totals, total_count });
      setCurrentDataPeriod(formData.period);

      if (items.length > 0) setColumns(Object.keys(items[0]));
      else if (overall_totals) setColumns(Object.keys(overall_totals));
      else setColumns([]);

      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading sales Staff Report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchSalesAdminReport(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    fetchSalesAdminReport(nextPage);
  };

  const formatColumnLabel = (key) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.endsWith(".0000"))
      return value.split(".")[0];
    return value;
  };

  const totalPages = Math.ceil(data.total_count / pageSize);

  useEffect(() => {
    if (data.items.length > 0 || data.overall_totals) {
      fetchSalesAdminReport(1);
    }
  }, [pageSize]);

  /** ---------------- PDF DOWNLOAD ------------------- */
const downloadPdf = async () => {
  const params = new URLSearchParams({
    period: formData.period,
    from: formData.fromDate,
    to: formData.toDate,
    pageSize: "9999",
    currentPage: "1",
    storeIds: formData.storeId ?? "",
    showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
    orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
    dateUsed: formData.dateUsed,
    adminUser: formData.adminUser || "",
  });

  const url = `${storeCode}/V1/pos/sales-admin-report?${params.toString()}`;
  const response = await submitSalesAdminReport(url);
  const result = response?.body?.[0];

  const items = result?.items || [];
  const overall = result?.overall_totals || null;

  // 🔥 Only this line is changed (landscape mode)
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Sales By Staff Report", 14, 15);

  if (items.length === 0) {
    doc.text("No records found.", 14, 25);
    doc.save("sales-by-admin-report.pdf");
    return;
  }

  const selectedColumns = [
    "period",
    "orders_count",
    "total_qty_ordered",
    "total_income_amount",
    "total_invoiced_amount",
    "total_tax_amount",
    "total_shipping_amount",
    "total_discount_amount",
    "total_refunded_amount",
    "total_canceled_amount",
    "gross_sales",
    "net_sales",
  ];

  const headers = selectedColumns.map((col) =>
    col
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  const tableData = items.map((item) =>
    selectedColumns.map((col) => item[col] ?? "-")
  );

  const overallRow = overall
    ? [
        { content: "Overall Totals", colSpan: 1, styles: { fontStyle: "bold" } },
        ...selectedColumns.slice(1).map((key) => overall[key] ?? "-"),
      ]
    : [];

  autoTable(doc, {
    startY: 20,
    head: [headers],
    body: tableData,
    ...(overallRow.length ? { foot: [overallRow] } : {}),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [35, 35, 35], textColor: [255, 255, 255] },
    footStyles: { fillColor: [35, 35, 35], textColor: [255, 255, 255] },
    theme: "grid",
  });

  doc.save("sales-by-admin-report.pdf");
};


  return (
    <div className={styles.page_detail}>
      <Link href={"/report"} className={styles.backButton}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Reports
      </Link>

      {/* FILTERS */}
      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>Filter</span>
        </div>

        <div className={styles.filter_grid}>

          {/* Date Used */}
          <div className={styles.filter_group}>
            <label>Date Used</label>
            <select name="dateUsed" value={formData.dateUsed} onChange={handleChange}>
              <option value="order">Order Created</option>
            </select>
          </div>

          {/* Period */}
          <div className={styles.filter_group}>
            <label>Period</label>
            <select name="period" value={formData.period} onChange={handleChange}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="overall">Overall</option>
            </select>
          </div>

          {/* From Date */}
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

          {/* To Date */}
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

          {/* Order Status */}
          <div className={styles.filter_group}>
            <label>Order Status</label>
            <select
              name="orderStatus"
              value={formData.orderStatus}
              onChange={handleChange}
            >
              <option value="Any">Any</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="complete">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Empty Rows */}
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

          {/* Store ID Dropdown */}
          <div className={styles.filter_group}>
            <label>Store</label>
            <select
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
            >
                {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.store_name}</option>
              ))}
            </select>
          </div>

          {/* Admin User Input */}
          <div className={styles.filter_group}>
            <label>Staff</label>
           {loginDetail?.admin_acl?.reports_other_staff ? <select name="adminUser" value={formData.adminUser} onChange={handleChange} id="">
              {employeesResult?.map((emp) => (
                <option key={emp.id} value={emp.username}>{emp?.username}</option>
              ))}
            </select> : <input className={styles.disabled_report} type="text" value={username} disabled/>}
            
          </div>
        </div>

        <div className={styles.filter_footer}>
          <button type="submit" className={styles.export_button}>
            Run Report
          </button>
        </div>
      </form>

      {/* TABLE */}
      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>Sales By Staff Report</h2>
        </div>

        {data.items.length > 0 && (
          <button type="button" onClick={downloadPdf}
            className={styles.export_button} style={{ margin: "10px 0" }}>
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
                  <td colSpan={columns.length} className={dashboardTable.loading}>
                    Loading...
                  </td>
                </tr>
              ) : currentDataPeriod === "overall" ? (
                data.overall_totals ? (
                  <tr className={dashboardTable.overallTotalsRow}>
                    <td className={dashboardTable.totalLabel}>Overall Totals</td>
                    {columns.slice(1).map((key) => (
                      <td key={`overall-${key}`}>
                        {formatValue(data.overall_totals[key])}
                      </td>
                    ))}
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={columns.length} className={dashboardTable.no_records}>
                      No records found.
                    </td>
                  </tr>
                )
              ) : data.items?.length > 0 ? (
                data.items.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={`${col}-${idx}`}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className={dashboardTable.no_records}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>

            {currentDataPeriod !== "overall" && data.overall_totals && (
              <tfoot>
                <tr className={dashboardTable.overallTotalsRow}>
                  <td className={dashboardTable.totalLabel}>Overall Totals</td>
                  {columns.slice(1).map((key) => (
                    <td key={`overall-${key}`}>
                      {formatValue(data.overall_totals[key])}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

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
      </div>
    </div>
  );
}
