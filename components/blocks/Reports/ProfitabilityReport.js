"use client";

import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";

export default function ProfitabilityReport({
  submitProfitabilityReport,
  stores = [],
  storeCode,
}) {
  const [formData, setFormData] = useState({
    period: "day",
    fromDate: "",
    toDate: "",
    storeIds: stores?.[0]?.id?.toString() || "0",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    grouped_items: {},
    total_count: 0,
  });

  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const buildUrl = (page = 1, full = false) => {
    const params = new URLSearchParams({
      period: formData.period,
      from: formData.fromDate,
      to: formData.toDate,
      storeIds: formData.storeIds,
    });

    if (!full) {
      params.append("pageSize", pageSize.toString());
      params.append("currentPage", page.toString());
    } else {
      params.append("pageSize", "9999");
      params.append("currentPage", "1");
    }

    return `${storeCode}/V1/pos/profitabiltyreport?${params.toString()}`;
  };

  const fetchProfitabilityReport = async (page = 1) => {
    const url = buildUrl(page);
    setLoading(true);
    try {
      const response = await submitProfitabilityReport(url);
      const result = response?.body?.[0] || {};
      setData({
        grouped_items: result.grouped_items || {},
        total_count: result.total_count || 0,
      });
      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading profitability report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProfitabilityReport(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    fetchProfitabilityReport(nextPage);
  };

        useEffect(() => {
        fetchProfitabilityReport(1);
      
    }, [pageSize]);

const downloadPdf = async () => {
  const url = buildUrl(1, true); 
  try {
    const response = await submitProfitabilityReport(url);
    const result = response?.body?.[0] || {};
    const groupedItems = result.grouped_items || {};

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Profitability Report", 14, 15);

    const allRows = [];
    let dynamicColumns = ["name", "sku", "qty_sold", "unit_price", "total_profit"]; // Default columns

    Object.entries(groupedItems).forEach(([groupKey, items]) => {
      if (items.length > 0) {
        // Update dynamic columns based on first item of the group
        dynamicColumns = Object.keys(items[0]);
      }

      // Add a row to indicate the group
      allRows.push([
        { content: `Period: ${groupKey}`, colSpan: dynamicColumns.length, styles: { halign: "left", fontStyle: "bold" } },
      ]);

      // Add the data rows
      items.forEach((item) => {
        allRows.push(dynamicColumns.map((col) => item[col] ?? "-"));
      });
    });

    const headers = dynamicColumns.map((col) =>
      col
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );

    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: allRows,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [35, 35, 35],
        textColor: [255, 255, 255],
      },
      footStyles: {
        fontStyle: "bold",
        fillColor: [35, 35, 35],
        textColor: [255, 255, 255],
      },
    });

    doc.save("profitability-report.pdf");
  } catch (err) {
    console.error("Failed to generate PDF:", err);
  }
};



  const totalPages = Math.ceil(data.total_count / pageSize);
  
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
        </div>

        <div className={styles.filter_footer}>
          <button type="submit" className={styles.export_button}>
            Run Report
          </button>
        </div>
      </form>

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>Profitability Report</h2>
        </div>
    {Object.keys(data.grouped_items).length > 0 && (
            <button
              type="button"
              onClick={downloadPdf}
              className={styles.export_button}
              style={{ marginTop: "10px" }}
            >
              Download Report
            </button>
          )}
        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity Ordered</th>
                <th>Quantity Invoiced</th>
                <th>Quantity Refunded</th>
                <th>Quantity Cancelled</th>
                <th>Net Quantity</th>
                <th>Unit Price</th>
                <th>Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={dashboardTable.loading}>
                    Loading...
                  </td>
                </tr>
              ) : Object.keys(data.grouped_items).length > 0 ? (
                Object.entries(data.grouped_items).map(([groupKey, items]) => (
                  <React.Fragment key={groupKey}>
                    <tr>
                      <td colSpan={5} className={dashboardTable.groupedRow}>
                        <strong>{groupKey}</strong>
                      </td>
                    </tr>
                    {items.map((item, i) => (
                      <tr key={`${groupKey}-${i}`}>
                        <td>{item.name}</td>
                        <td>{item.sku}</td>
                        <td>{item.qty_ordered}</td>
                        <td>{item.qty_invoiced}</td>
                        <td>{item.qty_refunded}</td>
                        <td>{item.qty_cancelled}</td>
                        <td>{item.net_qty}</td>
                        <td>{item.unit_price}</td>
                        <td>{item.total_profit}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={dashboardTable.no_records}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {
          <div className={styles.pagination}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
               totalItems={data?.total_count}
               pageSize={pageSize}
  setPageSize={setPageSize} 
              onPageChange={handlePageChange}
            />
          </div>
        }
      </div>
    </div>
  );
}
