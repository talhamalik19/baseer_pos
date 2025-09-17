"use client";
import React, { useState, useEffect } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function WarehouseTurnoverReport({
  submitWarehouseTurnoverReport,
  storeCode,
}) {
  const [warehouseCode, setWarehouseCode] = useState("");
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    period: "month",
    sku: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [data, setData] = useState({
    products: [],
    totalPages: 0,
    totalProducts: 0,
    averageTurnover: 0,
    reportPeriod: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("loginDetail");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setWarehouseCode(parsed?.warehouse?.warehouse_id || "SK");
      } catch {
        setWarehouseCode("SK");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = (page = 1) => {
    const params = new URLSearchParams({
      warehouseCode,
      sku: formData.sku,
      from: formData.from,
      to: formData.to,
      period: formData.period,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
    });
    return `${storeCode}/V1/pos/warehouseTurnoverReport?${params.toString()}`;
  };

  const fetchReport = async (page = 1) => {
    if (!warehouseCode || !formData.from || !formData.to) return;
    const url = buildUrl(page);
    setLoading(true);
    try {
      const response = await submitWarehouseTurnoverReport(url);
      const body = response?.body || [];

      if (body.length > 0) {
        const report = body[0];
        setData({
          products: report.products || [],
          totalPages: report.pagination?.total_pages || 0,
          totalProducts: report.total_products || 0,
          averageTurnover: report.average_turnover || 0,
          reportPeriod: report.report_period || "",
        });
      }

      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading turnover report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    fetchReport(nextPage);
  };

  const formatColumnLabel = (key) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

const downloadPdf = async () => {
  // Fetch all records — set large pageSize
  const params = new URLSearchParams({
    warehouseCode,
    sku: formData.sku,
    from: formData.from,
    to: formData.to,
    period: formData.period,
    pageSize: "999999", // big number for all results
    currentPage: "1",
  });

  const url = `${storeCode}/V1/pos/warehouseTurnoverReport?${params.toString()}`;
  const response = await submitWarehouseTurnoverReport(url);
  const body = response?.body || [];
  if (body.length === 0) return;

  const report = body[0];
  const products = report.products || [];

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Warehouse Turnover Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Period: ${report.report_period}`, 14, 22);
  doc.text(`Total Products: ${report.total_products}`, 14, 28);
  doc.text(`Average Turnover: ${report.average_turnover}`, 14, 34);

  if (products.length === 0) {
    doc.text("No records found.", 14, 44);
    doc.save("warehouse-turnover-report.pdf");
    return;
  }

  // Only important fields
  const importantFields = [
    "sku",
    "product_name",
    "total_sold",
    "current_stock",
    "turnover_ratio",
    "movement_speed",
    "recommendation",
  ];

  const headers = importantFields.map(formatColumnLabel);
  const tableData = products.map((item) =>
    importantFields.map((field) => item[field] ?? "")
  );

  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [35, 35, 35], textColor: [255, 255, 255] },
    theme: "grid",
  });

  doc.save("warehouse-turnover-report.pdf");
};

  return (
    <div className={styles.page_detail}>
      <Link href={"/report"} className={styles.backButton}>
        ← Back to Reports
      </Link>

      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>Filter</span>
        </div>
        <div className={styles.filter_grid}>
          <div className={styles.filter_group}>
            <label>From Date</label>
            <input
              type="date"
              name="from"
              value={formData.from}
              onChange={handleChange}
            />
          </div>
          <div className={styles.filter_group}>
            <label>To Date</label>
            <input
              type="date"
              name="to"
              value={formData.to}
              onChange={handleChange}
            />
          </div>
          <div className={styles.filter_group}>
            <label>SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Enter SKU"
            />
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
        </div>
        <div className={styles.filter_footer}>
          <button type="submit" className={styles.export_button}>
            Run Report
          </button>
        </div>
      </form>

      {/* {data.reportPeriod && (
        <div style={{ margin: "10px 0" }}>
          <strong>Report Period:</strong> {data.reportPeriod} <br />
          <strong>Total Products:</strong> {data.totalProducts} <br />
          <strong>Average Turnover:</strong> {data.averageTurnover}
        </div>
      )} */}

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>Warehouse Turnover Report</h2>
        </div>
        {data.products.length > 0 && (
          <button
            type="button"
            onClick={downloadPdf}
            className={styles.export_button}
            style={{ margin: "10px 0" }}
          >
            Download PDF
          </button>
        )}
        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                {data.products.length > 0 &&
                  Object.keys(data.products[0]).map((col) => (
                    <th key={col}>{formatColumnLabel(col)}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className={dashboardTable.loading}>
                    Loading...
                  </td>
                </tr>
              ) : data.products.length > 0 ? (
                data.products.map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(row).map((col) => (
                      <td key={`${col}-${idx}`}>{row[col]}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className={dashboardTable.no_records}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
