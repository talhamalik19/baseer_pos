"use client"
import React, { useState, useEffect } from 'react';
import styles from "../Dashboard/dashboard.module.scss";
import Link from 'next/link';
import Pagination from '@/components/shared/Pagination';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Format as "MMM DD, YYYY hh:mm A" (e.g., "Jun 15, 2023 03:30 PM")
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default function OrderList({
  text = "All Orders",
  items = [],
  isDownloadable,
  handleDownloadPDF,
  pageSize = 10,
  page = 1,
  pagination,
  setPage,
  setPagination,
  serverLanguage
}) {

const tableHead = {
  id: serverLanguage?.increment_id ?? "Increment ID",
  name: serverLanguage?.customer_name ?? "Customer Name",
  product: serverLanguage?.product_name ?? "Product",
  amount: serverLanguage?.amount ?? "Amount",
  medium: serverLanguage?.Medium ?? "Medium",
  created: serverLanguage?.created_at ?? "Created At",
  contact: serverLanguage?.contact ?? "Contact",
  status: serverLanguage?.actions ?? "Action"
};


  const [currentPage, setCurrentPage] = useState(page);

  // Sync internal state with prop changes
  useEffect(() => setCurrentPage(page), [page]);

  // Sort orders by date (newest first)
  const sortedOrders = React.useMemo(() => {
    return [...items].sort((a, b) => {
      // Handle cases where created_at might be missing
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [items]);

  // Calculate pagination values
  const totalItems = pagination ?? items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedOrders = pagination 
    ? sortedOrders // Server-side pagination - already paginated
    : sortedOrders.slice( // Client-side pagination
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setPage?.(newPage);
  };

  if (items.length === 0) {
    return (
      <div className={styles.orders}>
        <div className={styles.order_head}>
          <div className={styles.title}>{serverLanguage?.all_orders ?? text}</div>
        </div>
        <div className={styles.noResults}>{serverLanguage?.no_orders_present ?? 'No orders present'}</div>
      </div>
    );
  }
  
  return (
    <div className={styles.orders}>
      <div className={styles.order_head}>
        <div className={styles.title}>{serverLanguage?.all_orders ?? text}</div>
        {isDownloadable && (
          <button className={styles.download_orders} onClick={handleDownloadPDF}>Download Orders</button>
        )}
      </div>

      <div className={styles.table_block}>
        <table className={styles.table}>
          <thead>
            <tr>
              {Object.values(tableHead).map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr key={order.increment_id}>
                <td>{order.increment_id}</td>
                <td className={styles.name}>
                  {`${order.customer_firstname ?? 'POS'} ${order.customer_lastname ?? "Customer"}`}
                </td>
                <td>
                  {order.items.map(item => item.product_name).join(", ")}
                </td>
                <td className={styles.amount}>${order.order_grandtotal}</td>
                <td className={styles.amount}>
                  {order.increment_id.startsWith("POS") || order.increment_id.startsWith("ORD") ? "POS" : "Web/Mobile"}
                </td>
                <td className={styles.amount}>
                  {formatDate(order.created_at)}
                </td>
                <td className={styles.amount}>
                  {order?.shipping_address?.telephone || 'N/A'}
                </td>
                <td>
                  <Link 
                    className={styles.viewDetailBtn}
                    href={`/order/${order.increment_id}`}
                  >
                    {serverLanguage?.view_detail ?? 'View Detail'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}