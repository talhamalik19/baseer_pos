import React from 'react';
import styles from './report.module.scss';
import ReportCard from './ReportCard';


export default function Reports({serverLanguage}) {
const reportGroups = [
  {
    heading: serverLanguage?.sales_reports ?? 'Sales Reports',
    reports: [
      {
        id: 'sales',
        title: serverLanguage?.sales_orders ?? 'Sales (Orders)',
        href: '/report/sales',
      },
      {
        id: 'invoice',
        title: serverLanguage?.invoices ?? 'Invoices',
        href: '/report/invoice',
      },
      {
        id: 'shipped',
        title: serverLanguage?.shipped ?? 'Shipped',
        href: '/report/shipped',
      },
      {
        id: 'refunded',
        title: serverLanguage?.refunds ?? 'Refunds',
        href: '/report/refund',
      },
      {
        id: 'tax',
        title: serverLanguage?.tax ?? 'Tax',
        href: '/report/tax',
      },
      {
        id: 'coupon',
        title: serverLanguage?.coupons ?? 'Coupons',
        href: '/report/coupon',
      },
        {
        id: 'profitability',
        title: serverLanguage?.profitability_report ?? 'Profitability Report',
        href: '/report/profitability-report',
      },
         {
        id: 'sales_by_category',
        title: serverLanguage?.sales_by_category ?? 'Sales By Category',
        href: '/report/sales-by-category',
      },
       {
        id: 'peak_hour_report',
        title: serverLanguage?.sales_by_peak_hour ?? 'Sales By Peak Hour',
        href: '/report/peak-hour-report',
      },
       {
        id: 'sales_by_payment_type',
        title: serverLanguage?.sales_by_payment_type ?? 'Sales Payment Type',
        href: '/report/sales-by-payment-type',
      },
      {
        id: 'sales_coupon_discount',
        title: serverLanguage?.sales_coupon_discount ?? 'Sales Coupon Discount',
        href: '/report/sales-coupon-discount',
      },
      {
        id: 'sales_by_items',
        title: serverLanguage?.sales_by_items ?? 'Sales By Items',
        href: '/report/sales-by-item',
      },
      {
        id: 'sales_void_return',
        title: serverLanguage?.sales_void_return ?? 'Sales Void Return',
        href: '/report/sales-void-return',
      },
      {
        id: 'transaction_detail_report',
        title: serverLanguage?.transaction_detail_report ?? 'Transaction Detail Report',
        href: '/report/transaction-detail-report',
      },
       {
        id: 'inventory',
        title: serverLanguage?.Bestseller ?? 'BestSeller',
        href: '/report/bestseller',
      },
       {
        id: 'worstseller_report',
        title: serverLanguage?.worstseller_report ?? 'WorstSeller Report',
        href: '/report/worstseller-report',
      },
    ],
  },
    {
    heading: serverLanguage?.inventory_reports ?? 'Inventory Reports',
    reports: [
        {
        id: 'warehouse_lowstocks',
        title: serverLanguage?.warehouse_lowstocks ?? 'Warehouse Low Stock',
        href: '/report/warehouse-lowstocks',
      },
        {
        id: 'warehouse_stocks_level',
        title: serverLanguage?.warehouse_stocks_level ?? 'Warehouse Stock Level',
        href: '/report/warehouse-stocklevel',
      },
         {
        id: 'warehouse_stocks_valuation',
        title: serverLanguage?.warehouse_stocks_valuation ?? 'Warehouse Stock Valuation',
        href: '/report/warehouse-stockvaluation',
      },
         {
        id: 'warehouse_inventory_usage',
        title: serverLanguage?.warehouse_inventory_usage ?? 'Warehouse Inventory Usage',
        href: '/report/warehouse-inventory-usage',
      },
         {
        id: 'warehouse_inventory_turnover',
        title: serverLanguage?.warehouse_inventory_turnover ?? 'Warehouse Inventory Turnover',
        href: '/report/warehouse-turnover',
      },
    ],
  },
  {
    heading: serverLanguage?.customer_reports ?? 'Customer Reports',
    reports: [
      {
        id: 'customer',
        title: serverLanguage?.customers ?? 'Customers',
        href: '/report/customer',
      },
    ],
  },

];

return (
    <div className={'page_detail'}>
      {reportGroups.map(group => (
        <div key={group.heading} className={styles.report_group}>
          <h2 className={styles.group_heading}>{group.heading}</h2>
          <div className={styles.grid_3}>
            {group.reports.map(({ id, title, href }) => (
              <ReportCard key={id} title={title} href={href} serverLanguage={serverLanguage}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
