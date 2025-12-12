"use client";
import React, { useEffect, useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";

export default function CustomerReport({ submitCustomerReport, storeCode, stores = [] }) {
const [formData, setFormData] = useState({
  period: "day",
  fromDate: "",
  toDate: "",
  storeIds: stores?.[0]?.id?.toString() || "1",
  customerName: "",
  detailedReport: "Yes",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = (page = 1) => {
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      storeIds: formData.storeIds,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
      detailedReport: formData.detailedReport === "Yes" ? "1" : "0",
    });

    if (formData.customerName.trim()) {
      params.append("customerName", formData.customerName.trim());
    }

    return `${storeCode}/V1/pos/sales-customer-report?${params.toString()}`;
  };

  const fetchCustomerReport = async (page = 1) => {
    const url = buildUrl(page);
    setLoading(true);
    try {
      const response = await submitCustomerReport(url);
      const result = response?.body?.[0];

      const items = result?.items || [];
      const totals = result?.totals || null;
      const overall_totals = result?.overall_totals || null;
      const total_count = result?.overall_total_count || 0;

      setData({ items, totals, overall_totals, total_count });

      if (items.length > 0) {
        setColumns(Object.keys(items[0]));
      } else if (totals) {
        setColumns(Object.keys(totals).filter((key) => key !== "is_total"));
      } else {
        setColumns([]);
      }

      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading customer report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCustomerReport(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    fetchCustomerReport(nextPage);
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
        fetchCustomerReport(1);
      }
    }, [pageSize]);
    

  return (
    <div className={styles.page_detail}>
        <Link href={'/report'} className={styles.backButton}><svg
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
 Back to Reports</Link>
      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>Filter</span>
        </div>

        <div className={styles.filter_grid}>
          <div className={styles.filter_group}>
            <label>Period</label>
            <select name="period" value={formData.period} onChange={handleChange}>
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
  <label>Store</label>
  <select
    name="storeIds"
    value={formData.storeIds}
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
            <label>Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter full customer name"
            />
          </div>

          <div className={styles.filter_group}>
            <label>Detailed Report</label>
            <select name="detailedReport" value={formData.detailedReport} onChange={handleChange}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
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
          <h2 className={dashboardTable.title}>Customer Report</h2>
        </div>

        <div className={`${dashboardTable.table_block} ${styles.table_report_block}`}>
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
              ) : formData?.period !== "overall" && (data.items?.length > 0  ? (
                data.items.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {columns.map((col) => (
                      <td key={`${col}-${rowIdx}`}>{formatValue(row[col])}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className={dashboardTable.no_records}>
                    No records found.
                  </td>
                </tr>
              ))}
            </tbody>

            {data.totals && (
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
                    <td className={dashboardTable.totalLabel}>Overall Totals</td>
                    {columns.slice(1).map((key) => (
                      <td key={`overall-${key}`} className={dashboardTable.overallTotal}>
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
