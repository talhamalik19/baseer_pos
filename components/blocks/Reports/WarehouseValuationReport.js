"use client";
import React, { useState, useEffect } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function WarehouseValuationReport({ submitWarehouseValuationReport, storeCode }) {
  const [warehouseCode, setWarehouseCode] = useState("");
  const [formData, setFormData] = useState({
    priceType: "price"
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    items: [],
    page_totals: null,
    overall_totals: null,
    total_records: 0
  });
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const stored = localStorage.getItem("loginDetail");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setWarehouseCode(parsed?.warehouse?.warehouse_id || "");
      } catch {
        setWarehouseCode("");
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
      priceType: formData.priceType,
      pageSize: pageSize.toString(),
      currentPage: page.toString()
    });
    return `${storeCode}/V1/pos/warehousevaluationstock?${params.toString()}`;
  };

  const fetchReport = async (page = 1) => {
    if (!warehouseCode) return;
    const url = buildUrl(page);
    setLoading(true);
    try {
      const response = await submitWarehouseValuationReport(url);
      const result = response?.body?.[0] || {};
      const items = result?.items || [];
      const page_totals = result?.page_totals || null;
      const overall_totals = result?.overall_totals || null;
      const total_records = result?.total_records || 0;

      setData({ items, page_totals, overall_totals, total_records });

      if (items.length > 0) {
        setColumns(Object.keys(items[0]));
      } else {
        setColumns([]);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading warehouse valuation report:", err);
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

  const formatColumnLabel = (key) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    return value;
  };

  const totalPages = Math.ceil(data.total_records / pageSize);

     useEffect(() => {
      if (data.items.length > 0 || data.overall_totals) {
        fetchReport(1);
      }
    }, [pageSize]);

  const downloadPdf = async () => {
    const params = new URLSearchParams({
      warehouseCode,
      priceType: formData.priceType,
      pageSize: "9999",
      currentPage: "1"
    });
    const url = `${storeCode}/V1/pos/warehousevaluationstock?${params.toString()}`;
    const response = await submitWarehouseValuationReport(url);
    const result = response?.body?.[0] || {};
    const items = result?.items || [];
    const overall = result?.overall_totals || null;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Warehouse Valuation Report", 14, 15);

    if (items.length === 0) {
      doc.text("No records found.", 14, 25);
      doc.save("warehouse-valuation-report.pdf");
      return;
    }

    const selectedColumns = Object.keys(items[0]);
    const headers = selectedColumns.map(formatColumnLabel);
    const tableData = items.map((item) =>
      selectedColumns.map((col) => item[col] ?? "-")
    );

    // const overallRow = overall
    //   ? [
    //       { content: "Overall Totals", colSpan: 1, styles: { fontStyle: "bold" } },
    //       ...selectedColumns.slice(1).map((key) => overall[key] ?? "-")
    //     ]
    //   : [];

    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: tableData,
    //   ...(overallRow.length ? { foot: [overallRow] } : {}),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [35, 35, 35], textColor: [255, 255, 255] },
      footStyles: { fontStyle: "bold", fillColor: [35, 35, 35], textColor: [255, 255, 255] },
      theme: "grid"
    });

    doc.save("warehouse-valuation-report.pdf");
  };

  return (
    <div className={styles.page_detail}>
      <Link href={"/report"} className={styles.backButton}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reports
      </Link>

      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}><span>Filter</span></div>
        <div className={styles.filter_grid}>
          <div className={styles.filter_group}>
            <label>Price Type</label>
            <select name="priceType" value={formData.priceType} onChange={handleChange}>
              <option value="price">Price</option>
              <option value="cost">Cost</option>
            </select>
          </div>
        </div>
        <div className={styles.filter_footer}>
          <button type="submit" className={styles.export_button}>Run Report</button>
        </div>
      </form>

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <h2 className={dashboardTable.title}>Warehouse Valuation Report</h2>
        </div>
        {data.items.length > 0 && (
          <button type="button" onClick={downloadPdf} className={styles.export_button} style={{ margin: "10px 0" }}>
            Download PDF
          </button>
        )}
        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                {columns.map((col) => (<th key={col}>{formatColumnLabel(col)}</th>))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className={dashboardTable.loading}>Loading...</td></tr>
              ) : data.items.length > 0 ? (
                data.items.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {columns.map((col) => (<td key={`${col}-${rowIdx}`}>{formatValue(row[col])}</td>))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} className={dashboardTable.no_records}>No records found.</td></tr>
              )}
            </tbody>
            {/* {data.page_totals && !loading && (
              <tfoot>
                <tr className={dashboardTable.totalsRow}>
                  <td className={dashboardTable.totalLabel}>Page Totals</td>
                  {columns.slice(1).map((key) => (
                    <td key={`total-${key}`} className={dashboardTable.total}>
                      {formatValue(data.page_totals[key])}
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
            )} */}
          </table>
        </div>
        {
          <div className={styles.pagination}>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange}    totalItems={data?.total_records}
               pageSize={pageSize}
  setPageSize={setPageSize}/>
          </div>
        }
      </div>
    </div>
  );
}
