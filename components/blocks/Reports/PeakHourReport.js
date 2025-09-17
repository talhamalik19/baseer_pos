"use client";

import React, { useState } from "react";
import styles from "./report.module.scss";
import dashboardTable from "../Dashboard/dashboard.module.scss";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesPeakHourReport({
  stores,
  storeCode,
  submitPeakHourReport,
}) {
  const [formData, setFormData] = useState({
    storeId: "",
    fromDate: "",
    toDate: "",
    orderStatus: "Any",
    emptyRows: "Yes",
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildUrl = () => {
    const storeParam = formData.storeId || stores.map((s) => s.id).join(",");

    const params = new URLSearchParams({
      from: formData.fromDate,
      to: formData.toDate,
      pageSize: "1",
      currentPage: "1",
      storeIds: storeParam,
      showEmptyRows: formData.emptyRows === "Yes" ? "1" : "0",
      orderStatuses: formData.orderStatus === "Any" ? "" : formData.orderStatus,
      dateUsed: "created_at",
    });

    return `${storeCode}/V1/pos/sales-peak-time-report?${params.toString()}&maxPeakHours=4`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = buildUrl();
      const response = await submitPeakHourReport(url);
      setReportData(response[0] || null);
    } catch (err) {
      console.error("Fetch error:", err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const transformHourData = (hourData) => {
    if (!hourData) return [];
    
    return hourData.reduce((acc, dayData) => {
      if (dayData.hours && dayData.hours.length) {
        return [...acc, ...dayData.hours.map(hour => ({
          day: dayData.day,
          hour: hour.hour,
          value: hour.value,
          dates: hour.dates
        }))];
      }
      return acc;
    }, []);
  };

  const renderTable = (title, data, includeHour = false) => {
    // Transform data if it's in the hours format
    const displayData = data && data[0]?.hours 
      ? transformHourData(data)
      : data || [];

    return (
      <div className={dashboardTable.subTable}>
        <h3>{title}</h3>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              {includeHour && <th>Hour</th>}
              <th>Value</th>
              <th>Dates</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr key={`${title}-${idx}`}>
                <td>{row.day}</td>
                {includeHour && <td>{row.hour || "-"}</td>}
                <td>{row.value}</td>
                <td>
                  {Array.isArray(row.dates)
                    ? row.dates.join(", ")
                    : Object.values(row.dates || {}).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.text("Peak Hour Sales Report", 14, 16);

    const addTable = (title, data, includeHour = false, startY = 25) => {
      // Transform data if it's in the hours format
      const displayData = data && data[0]?.hours 
        ? transformHourData(data)
        : data || [];

      autoTable(doc, {
        startY,
        head: [
          includeHour
            ? ["Day", "Hour", "Value", "Dates"]
            : ["Day", "Value", "Dates"],
        ],
        body: displayData.map((row) => [
          row.day,
          ...(includeHour ? [row.hour || "-"] : []),
          row.value,
          Array.isArray(row.dates)
            ? row.dates.join(", ")
            : Object.values(row.dates || {}).join(", "),
        ]),
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: {
          fillColor: [35, 35, 35],
          textColor: [255, 255, 255],
        },
        footStyles: {
          fontStyle: "bold",
          fillColor: [35, 35, 35],
          textColor: [255, 255, 255],
        },
        margin: { top: startY },
      });
    };

    let y = 25;
    const sections = [
      ["Top Days by Orders", reportData?.peak_times?.top_days_by_orders],
      ["Top Days by Revenue", reportData?.peak_times?.top_days_by_revenue],
      [
        "Top Hours by Orders",
        reportData?.peak_times?.top_hours_by_orders,
        true,
      ],
      [
        "Top Hours by Revenue",
        reportData?.peak_times?.top_hours_by_revenue,
        true,
      ],
    ];

    sections.forEach(([title, data, includeHour]) => {
      if (data?.length) {
        doc.text(title, 14, y);
        addTable(title, data, includeHour, y + 4);
        y = doc.lastAutoTable.finalY + 10;
      }
    });

    doc.save("peak_hour_sales_report.pdf");
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
        </svg>
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
          <h2 className={dashboardTable.title}>Peak Hour Sales Report</h2>
        </div>
        {reportData?.peak_times && (
          <button
            type="button"
            onClick={downloadPdf}
            className={styles.export_button}
          >
            Download PDF
          </button>
        )}
        <div className={dashboardTable.table_block}>
          {loading ? (
            <p>Loading...</p>
          ) : reportData?.peak_times ? (
            <>
              {renderTable(
                "Top Days by Orders",
                reportData.peak_times.top_days_by_orders
              )}
              {renderTable(
                "Top Days by Revenue",
                reportData.peak_times.top_days_by_revenue
              )}
              {renderTable(
                "Top Hours by Orders",
                reportData.peak_times.top_hours_by_orders,
                true
              )}
              {renderTable(
                "Top Hours by Revenue",
                reportData.peak_times.top_hours_by_revenue,
                true
              )}
            </>
          ) : (
            <p>No data found.</p>
          )}
        </div>
      </div>
    </div>
  );
}