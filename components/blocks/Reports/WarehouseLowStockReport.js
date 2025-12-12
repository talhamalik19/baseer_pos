"use client";
import React, { useEffect, useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";

export default function WarehouseLowStockReport({ submitWarehouseReport, storeCode }) {
  const [warehouseCode, setWarehouseCode] = useState("");
  const [data, setData] = useState({ items: [], total_count: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(data.total_count / pageSize);

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

  const buildUrl = (page = 1) => {
    const params = new URLSearchParams({
      warehouseCode: warehouseCode,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
    });
    return `${storeCode}/V1/pos/warehouselowstockreport?${params.toString()}`;
  };

  const fetchReport = async (page = 1) => {
    if (!warehouseCode) return;
    setLoading(true);
    try {
      const url = buildUrl(page);
      const response = await submitWarehouseReport(url);
      const result = response?.body?.[0] || { items: [], total_count: 0 };
      setData({ items: result.items || [], total_count: result.total_count || 0 });
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching warehouse report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(1);
  }, [warehouseCode]);

  const formatColumnLabel = (key) =>
    key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className={styles.page_detail}>
      <Link href={"/report"} className={styles.backButton}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reports
      </Link>

      <form onSubmit={(e) => { e.preventDefault(); fetchReport(1); }} className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>Filter</span>
        </div>
        <div className={styles.filter_grid}>
          <div className={styles.filter_group}>
            <label>Warehouse Code</label>
            <input type="text" value={warehouseCode} disabled />
            <p className={styles.info}>
    This value is automatically set based on Admin assigned warehouse.
            </p>
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
          <h2 className={dashboardTable.title}>Warehouse Low Stock Report</h2>
        </div>
        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                {data.items.length > 0 && (
                  Object.keys(data.items[0]).map((col) => (
                    <th key={col}>{formatColumnLabel(col)}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={data.items.length || 1} className={dashboardTable.loading}>
                    Loading...
                  </td>
                </tr>
              ) : data.items.length > 0 ? (
                data.items.map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(row).map((col) => (
                      <td key={`${col}-${idx}`}>{row[col] ?? "-"}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={data.items.length || 1} className={dashboardTable.no_records}>
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
              onPageChange={(page) => fetchReport(page)}
            />
          </div>
        }
      </div>
    </div>
  );
}
