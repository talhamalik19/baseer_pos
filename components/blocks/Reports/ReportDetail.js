"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import { getSalesReportAction } from "@/lib/Magento/actions";
import Pagination from "@/components/shared/Pagination";

// Constants
const REPORT_CONFIG = {
  sales: ["created_at", "updated_at"],
  invoice: ["order", "invoiced"],
  shipped: ["order", "shipped"],
  refund: ["order", "refund"],
  tax: ["created_at", "updated_at"],
  coupon: ["created_at", "updated_at"],
  customer: ["created_at", "updated_at"],
  inventory: ["created_at", "updated_at"],
  bestseller: ["created_at", "updated_at"],
};

const PERIOD_OPTIONS = ["day", "month", "year", "overall"];
const DEFAULT_PAGE_SIZE = 10;
const INITIAL_PAGE = 1;

// Helper functions
const formatColumnLabel = (key) => {
  if (!key) return "";
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatValueForDisplay = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && (value.endsWith(".00") || value.endsWith(".0000"))) {
    return value.split(".")[0];
  }
  return value;
};

const getInitialFilters = (type) => ({
  dateUsed: REPORT_CONFIG[type]?.[0] || "",
  period: "day",
  fromDate: "",
  toDate: "",
  orderStatus: "Any",
  emptyRows: "No",
  showActualValues: "No",
  customerName: "",
  detailedReport: "Yes",
  storeIds: "1",
  productName: "",
  sku: "",
});

const ReportDetail = ({
  title = "Reports",
  type,
  backHref = "/report",
  serverLanguage = {},
  storeCode
}) => {
  // State
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState(() => getInitialFilters(type));
  const [data, setData] = useState({
    items: [],
    totals: null,
    totalCount: 0,
    overall_totals: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pdfConfig, setPdfConfig] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hasRunReport, setHasRunReport] = useState(false);

  // Memoized values
  const dateOptions = useMemo(() => REPORT_CONFIG[type] || [], [type]);
  const isInventoryOrBestseller = useMemo(
    () => ["inventory", "bestseller"].includes(type),
    [type]
  );
  const isCustomerReport = useMemo(() => type === "customer", [type]);
  const totalPages = useMemo(
    () => Math.ceil(data.totalCount / pageSize),
    [data.totalCount, pageSize]
  );

  // API URL construction
  const buildApiUrl = useCallback((forDownload = false) => {
    const baseParams = {
      period: filters.period,
      from: filters.fromDate,
      to: filters.toDate,
      pageSize: pageSize.toString(),
      currentPage: currentPage.toString(),
    };

    if (isInventoryOrBestseller) {
      const params = new URLSearchParams({
        ...baseParams,
        storeIds: filters.storeIds,
      });

      if (filters.productName.trim()) params.append("productName", filters.productName.trim());
      if (filters.sku.trim()) params.append("sku", filters.sku.trim());

      const basePath = type !== "inventory" 
        ? `${storeCode}/V1/pos/${type}report` 
        : `V1/pos/bestsellerreport`;
      
      return forDownload 
        ? `${basePath}/download?${params.toString()}`
        : `${basePath}?${params.toString()}`;
    }

    if (!isCustomerReport) {
      const params = new URLSearchParams({
        ...baseParams,
        storeIds: "1",
        showEmptyRows: filters.emptyRows === "Yes" ? "1" : "0",
        orderStatuses: filters.orderStatus === "Any" ? "" : filters.orderStatus,
        dateUsed: filters.dateUsed,
      });

      const path = type === "sales" ? "sales-report" : `sales-${type}-report`;
      return forDownload
        ? `${storeCode}/V1/pos/${path}/download?${params.toString()}`
        : `${storeCode}/V1/pos/${path}?${params.toString()}`;
    }

    const customerParams = [
      `period=${encodeURIComponent(filters.period)}`,
      `from=${encodeURIComponent(filters.fromDate)}`,
      `to=${encodeURIComponent(filters.toDate)}`,
      `storeIds=${encodeURIComponent(filters.storeIds)}`,
      `pageSize=${pageSize}`,
      `currentPage=${currentPage}`,
      `detailedReport=${filters.detailedReport === "Yes" ? "1" : "0"}`,
    ];

    if (filters.customerName.trim()) {
      customerParams.push(`customerName=${encodeURIComponent(filters.customerName.trim())}`);
    }

    return forDownload
      ? `${storeCode}/V1/pos/sales-customer-report/download?${customerParams.join("&")}`
      : `${storeCode}/V1/pos/sales-customer-report?${customerParams.join("&")}`;
  }, [filters, type, currentPage, pageSize, isInventoryOrBestseller, isCustomerReport]);

  const apiUrl = useMemo(() => buildApiUrl(false), [buildApiUrl]);
  const pdfApiUrl = useMemo(() => buildApiUrl(true), [buildApiUrl]);

  // Data fetching
  const runReport = useCallback(async () => {
    if (!filters.fromDate || !filters.toDate) {
      setError("Please select both From and To dates");
      return;
    }

    setLoading(true);
    setError(null);
    setHasRunReport(true);

    try {
      const result = await getSalesReportAction(apiUrl);
      const items = result?.[0]?.items || [];
      const totals = result?.[0]?.totals || null;
      const overall_totals = result?.[0]?.overall_totals || null;
      const totalCount = result?.[0]?.total_count || 0;

      setData({ items, totals, overall_totals, totalCount });

      if (items.length > 0) {
        setColumns(
          Object.keys(items[0]).map((key) => ({
            key,
            label: formatColumnLabel(key),
          }))
        );
      } else if (totals) {
        setColumns(
          Object.keys(totals)
            .filter((key) => key !== "is_total")
            .map((key) => ({
              key,
              label: formatColumnLabel(key),
            }))
        );
      } else {
        setColumns([]);
      }
    } catch (err) {
      setError(err.message);
      setData({ items: [], totals: null, totalCount: 0, overall_totals: null });
      setColumns([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filters.fromDate, filters.toDate]);

  const generateReportPDF = async () => {
    if (!hasRunReport) {
      setError("Please run the report first before generating PDF");
      return;
    }
    
    setIsGeneratingPDF(true);
    try {
      // Generate the PDF download URL with /download endpoint
      const downloadUrl = buildApiUrl(true);
      const pdfResponse = await getSalesReportAction(downloadUrl);
      window.open(pdfResponse, "_blank")
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const config = JSON.parse(localStorage.getItem("jsonData")) || {};
      setPdfConfig(config);
    }
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key !== "emptyRows" && key !== "showActualValues") {
        setCurrentPage(INITIAL_PAGE);
      }
      return newFilters;
    });
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    if (hasRunReport) {
      runReport();
    }
  }, [hasRunReport, runReport]);

  const renderTableBody = () => {
    if (!hasRunReport) {
      return (
        <tr>
          <td colSpan={columns.length}>
            <div className={dashboardTable.no_records}>
              {serverLanguage?.run_report_first || "Please run the report to see data"}
            </div>
          </td>
        </tr>
      );
    }

    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length} className={dashboardTable.loading}>
            {serverLanguage?.loading || "Loading..."}
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={columns.length} className={dashboardTable.error}>
            {serverLanguage?.error || "Error"}: {error}
          </td>
        </tr>
      );
    }

    if (data.items.length === 0 && filters?.period !== "overall") {
      return (
        <tr>
          <td colSpan={columns.length}>
            <div className={dashboardTable.no_records}>
              {serverLanguage?.no_records || "We couldn't find any records."}
            </div>
          </td>
        </tr>
      );
    }

    return data.items.map((row, idx) => (
      <tr key={`row-${idx}`}>
        {Object.entries(row).map(([key, value]) => {
          let cellClass = "";
          if (key === "orders_count" || key === "quantity_ordered" || key === "total_sales") {
            cellClass = dashboardTable.amount;
          } else if (key === "status" && row.status) {
            cellClass = `${dashboardTable.status} ${dashboardTable[row.status]}`;
          }

          return (
            <td key={`cell-${key}-${idx}`} className={cellClass}>
              {formatValueForDisplay(value)}
            </td>
          );
        })}
      </tr>
    ));
  };

  const renderTableFooter = () => {
    if (!data.totals || !hasRunReport) return null;

    return (
      <tfoot>
        <tr className={dashboardTable.totalsRow}>
          <td className={dashboardTable.totalLabel}>Period Totals</td>
          {Object.entries(data.totals).map(([key, value]) => {
            if (key === "is_total") return null;
            return (
              <td key={`total-${key}`} className={dashboardTable.total}>
                {formatValueForDisplay(value)}
              </td>
            );
          })}
        </tr>
        {data.overall_totals && (
          <tr className={dashboardTable.overallTotalsRow}>
            <td className={dashboardTable.totalLabel}>Overall Totals</td>
            {Object.entries(data.overall_totals).map(([key, value]) => (
              <td key={`overall-total-${key}`} className={dashboardTable.overallTotal}>
                {formatValueForDisplay(value)}
              </td>
            ))}
          </tr>
        )}
      </tfoot>
    );
  };

  return (
    <div className={styles.page_detail}>
      <div className={styles.filter_section}>
        <div className={styles.filter_header}>
          <span>{serverLanguage?.filter || "Filter"}</span>
        </div>

        <div className={styles.filter_grid}>
          {!isInventoryOrBestseller && (
            <div className={styles.filter_group}>
              <label>{serverLanguage?.date_used || "Date Used"}</label>
              <select
                value={filters.dateUsed}
                onChange={(e) => handleFilterChange("dateUsed", e.target.value)}
              >
                {dateOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {formatColumnLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.filter_group}>
            <label>{serverLanguage?.period || "Period"}</label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange("period", e.target.value)}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {formatColumnLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filter_group}>
            <label>{serverLanguage?.from || "From"} *</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              required
            />
          </div>

          <div className={styles.filter_group}>
            <label>{serverLanguage?.to || "To"} *</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
              required
            />
          </div>

          {isInventoryOrBestseller ? (
            <>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.store_ids || "Store IDs"}</label>
                <input
                  type="text"
                  value={filters.storeIds}
                  onChange={(e) => handleFilterChange("storeIds", e.target.value)}
                />
              </div>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.product_name || "Product Name"}</label>
                <input
                  type="text"
                  value={filters.productName}
                  onChange={(e) => handleFilterChange("productName", e.target.value)}
                />
              </div>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.sku || "SKU"}</label>
                <input
                  type="text"
                  value={filters.sku}
                  onChange={(e) => handleFilterChange("sku", e.target.value)}
                />
              </div>
            </>
          ) : isCustomerReport ? (
            <>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.customer_name || "Customer Name"}</label>
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => handleFilterChange("customerName", e.target.value)}
                  placeholder={serverLanguage?.enter_full_customer_name || "Enter full customer name"}
                />
              </div>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.detailed_report || "Detailed Report"}</label>
                <select
                  value={filters.detailedReport}
                  onChange={(e) => handleFilterChange("detailedReport", e.target.value)}
                >
                  <option>{serverLanguage?.no || "No"}</option>
                  <option>{serverLanguage?.yes || "Yes"}</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.order_status || "Order Status"}</label>
                <select
                  value={filters.orderStatus}
                  onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
                >
                  <option>{serverLanguage?.any || "Any"}</option>
                  <option>{serverLanguage?.pending || "Pending"}</option>
                  <option>{serverLanguage?.completed || "Completed"}</option>
                  <option>{serverLanguage?.cancelled || "Cancelled"}</option>
                </select>
              </div>
              <div className={styles.filter_group}>
                <label>{serverLanguage?.empty_rows || "Empty Rows"}</label>
                <select
                  value={filters.emptyRows}
                  onChange={(e) => handleFilterChange("emptyRows", e.target.value)}
                >
                  <option>{serverLanguage?.no || "No"}</option>
                  <option>{serverLanguage?.yes || "Yes"}</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className={styles.filter_footer}>
          <button
            type="button"
            className={styles.export_button}
            onClick={runReport}
            disabled={loading || !filters.fromDate || !filters.toDate}
          >
            {loading
              ? serverLanguage?.loading || "Loading..."
              : serverLanguage?.run_report || "Run Report"}
          </button>
        </div>
      </div>

      <div className={dashboardTable.orders}>
        <div className={dashboardTable.order_head}>
          <div className={styles.reportTitleContainer}>
            <h2 className={dashboardTable.title}>
              {type === "inventory"
                ? serverLanguage?.inventory_report || "Inventory Report"
                : type === "bestseller"
                ? serverLanguage?.bestseller_report || "Bestseller Report"
                : serverLanguage?.filter_results || "Filter Results"}
            </h2>
            {hasRunReport && data.items.length > 0 && (
              <button
                onClick={generateReportPDF}
                disabled={isGeneratingPDF}
                className={styles.downloadButton}
              >
                {isGeneratingPDF 
                  ? serverLanguage?.generating_pdf || "Generating PDF..." 
                  : serverLanguage?.download_pdf || "Download PDF"}
              </button>
            )}
          </div>
        </div>

        <div className={dashboardTable.table_block}>
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={`header-${col.key}`}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
            {renderTableFooter()}
          </table>
        </div>

        {totalPages > 1 && hasRunReport && (
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
};

export default ReportDetail;