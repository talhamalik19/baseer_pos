"use client";
import React, { useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";

export default function BestsellerReport({
  submitBestSellerReport,
  stores = [],
  storeCode,
}) {
  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    storeIds: stores?.[0]?.id?.toString() || "1",
    productName: "",
    sku: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    grouped_items: {},
    total_count: 0,
    overall_total_count: 0,
  });
  const [columns, setColumns] = useState(["Product", "Price", "Order Quantity"]);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = (page = 1) => {
    const params = new URLSearchParams({
      from: formData.fromDate,
      to: formData.toDate,
      storeIds: formData.storeIds,
      pageSize: pageSize.toString(),
      currentPage: page.toString(),
    });

    if (formData.productName.trim()) {
      params.append("productName", formData.productName.trim());
    }

    if (formData.sku.trim()) {
      params.append("sku", formData.sku.trim());
    }

    return `${storeCode}/V1/pos/bestsellerreport?${params.toString()}`;
  };

  const fetchInventoryReport = async (page = 1) => {
    const url = buildUrl(page);
    setLoading(true);
    try {
      const response = await submitBestSellerReport(url);
      const result = response?.body?.[0];

      const grouped_items = result?.grouped_items || {};
      const total_count = result?.total_count || 0;
      const overall_total_count = result?.overall_total_count || 0;

      setData({ grouped_items, total_count, overall_total_count });

      // Set columns from first product in first group
      const firstGroup = Object.values(grouped_items)?.[0]?.[0];
      if (firstGroup) {
        setColumns(["name", "price", "qty_sold"]);
      } else {
        setColumns([]);
      }

      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading inventory report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchInventoryReport(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1) return;
    fetchInventoryReport(nextPage);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.endsWith(".0000")) {
      return value.split(".")[0];
    }
    return value;
  };

  const totalPages = Math.ceil(data.total_count / pageSize);

  return (
    <div className={styles.page_detail}>
      <Link href={"/report"} className={styles.backButton}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Reports
      </Link>

      <form onSubmit={handleSubmit} className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>Filter</span>
        </div>

        <div className={styles.filter_grid}>
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
            <select name="storeIds" value={formData.storeIds} onChange={handleChange}>
              {stores?.map((store) => (
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
          <h2 className={dashboardTable.title}>Bestseller Report</h2>
        </div>

        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Order Quantity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className={dashboardTable.loading}>
                    Loading...
                  </td>
                </tr>
              ) : Object.keys(data.grouped_items).length > 0 ? (
                Object.entries(data.grouped_items).map(([date, items]) => {
                  const parsedDate = new Date(date);
                  const label = `${
                    parsedDate.getMonth() + 1
                  }/${parsedDate.getFullYear()}`;

                  return (
                    <React.Fragment key={date}>
                      <tr>
                        <td colSpan={3} className={dashboardTable.groupedRow}>
                          <strong>{label}</strong>
                        </td>
                      </tr>
                      {items.map((item, i) => (
                        <tr key={`${date}-${i}`}>
                          <td>{item.name}</td>
                          <td>{item?.sku}</td>
                          <td>{item?.price}</td>
                          <td>{Number(item.qty_sold)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className={dashboardTable.no_records}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className={dashboardTable.totalsRow}>
                <td className={dashboardTable.totalLabel}>Total</td>
                <td></td>
                <td></td>
                <td>{data.overall_total_count}</td>
              </tr>
            </tfoot>
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
