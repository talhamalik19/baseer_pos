import React from "react";
import ReportsClient from "./ReportClient";


export default function Reports({ serverLanguage }) {

  const reportGroups = [
    {
      heading: serverLanguage?.sales_reports ?? "Sales Reports",
      reports: [
        {
          id: "sales",
          title: serverLanguage?.sales_orders ?? "Sales (Orders)",
          href: "/report/sales",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.5003 2.33333H7.00033C6.38149 2.33333 5.78799 2.57916 5.35041 3.01675C4.91282 3.45433 4.66699 4.04782 4.66699 4.66666V23.3333C4.66699 23.9522 4.91282 24.5457 5.35041 24.9832C5.78799 25.4208 6.38149 25.6667 7.00033 25.6667H21.0003C21.6192 25.6667 22.2127 25.4208 22.6502 24.9832C23.0878 24.5457 23.3337 23.9522 23.3337 23.3333V8.16666L17.5003 2.33333Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16.333 2.33333V6.99999C16.333 7.61883 16.5788 8.21233 17.0164 8.64991C17.454 9.0875 18.0475 9.33333 18.6663 9.33333H23.333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.6663 10.5H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6663 15.1667H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6663 19.8333H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "invoice",
          title: serverLanguage?.invoices ?? "Invoices",
          href: "/report/invoice",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.5003 2.33333H7.00033C6.38149 2.33333 5.78799 2.57916 5.35041 3.01675C4.91282 3.45433 4.66699 4.04782 4.66699 4.66666V23.3333C4.66699 23.9522 4.91282 24.5457 5.35041 24.9832C5.78799 25.4208 6.38149 25.6667 7.00033 25.6667H21.0003C21.6192 25.6667 22.2127 25.4208 22.6502 24.9832C23.0878 24.5457 23.3337 23.9522 23.3337 23.3333V8.16666L17.5003 2.33333Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16.333 2.33333V6.99999C16.333 7.61883 16.5788 8.21233 17.0164 8.64991C17.454 9.0875 18.0475 9.33333 18.6663 9.33333H23.333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.6663 10.5H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6663 15.1667H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6663 19.8333H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "shipped",
          title: serverLanguage?.shipped ?? "Shipped",
          href: "/report/shipped",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.333 21V7.00001C16.333 6.38117 16.0872 5.78767 15.6496 5.35009C15.212 4.9125 14.6185 4.66667 13.9997 4.66667H4.66634C4.0475 4.66667 3.45401 4.9125 3.01643 5.35009C2.57884 5.78767 2.33301 6.38117 2.33301 7.00001V19.8333C2.33301 20.1428 2.45592 20.4395 2.67472 20.6583C2.89351 20.8771 3.19026 21 3.49967 21H5.83301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17.5 21H10.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M22.1663 21H24.4997C24.8091 21 25.1058 20.8771 25.3246 20.6583C25.5434 20.4395 25.6663 20.1427 25.6663 19.8333V15.575C25.6659 15.3102 25.5754 15.0535 25.4097 14.847L21.3497 9.772C21.2406 9.63536 21.1021 9.52499 20.9446 9.44906C20.7871 9.37313 20.6145 9.33358 20.4397 9.33333H16.333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M19.8333 23.3333C21.122 23.3333 22.1667 22.2887 22.1667 21C22.1667 19.7113 21.122 18.6667 19.8333 18.6667C18.5447 18.6667 17.5 19.7113 17.5 21C17.5 22.2887 18.5447 23.3333 19.8333 23.3333Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M8.16634 23.3333C9.45501 23.3333 10.4997 22.2887 10.4997 21C10.4997 19.7113 9.45501 18.6667 8.16634 18.6667C6.87768 18.6667 5.83301 19.7113 5.83301 21C5.83301 22.2887 6.87768 23.3333 8.16634 23.3333Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
          {
          id: "sales",
          title: serverLanguage?.sales_by_admin ?? "Sales By Admin",
          href: "/report/sales-by-admin",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.5003 2.33333H7.00033C6.38149 2.33333 5.78799 2.57916 5.35041 3.01675C4.91282 3.45433 4.66699 4.04782 4.66699 4.66666V23.3333C4.66699 23.9522 4.91282 24.5457 5.35041 24.9832C5.78799 25.4208 6.38149 25.6667 7.00033 25.6667H21.0003C21.6192 25.6667 22.2127 25.4208 22.6502 24.9832C23.0878 24.5457 23.3337 23.9522 23.3337 23.3333V8.16666L17.5003 2.33333Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16.333 2.33333V6.99999C16.333 7.61883 16.5788 8.21233 17.0164 8.64991C17.454 9.0875 18.0475 9.33333 18.6663 9.33333H23.333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.6663 10.5H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6663 15.1667H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6663 19.8333H9.33301"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "refunded",
          title: serverLanguage?.refunds ?? "Refunds",
          href: "/report/refund",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 14C3.5 16.0767 4.11581 18.1068 5.26957 19.8335C6.42332 21.5602 8.0632 22.906 9.98182 23.7007C11.9004 24.4955 14.0116 24.7034 16.0484 24.2982C18.0852 23.8931 19.9562 22.8931 21.4246 21.4246C22.8931 19.9562 23.8931 18.0852 24.2982 16.0484C24.7034 14.0116 24.4955 11.9004 23.7007 9.98182C22.906 8.0632 21.5602 6.42332 19.8335 5.26957C18.1068 4.11581 16.0767 3.5 14 3.5C11.0646 3.51104 8.24713 4.65643 6.13667 6.69667L3.5 9.33333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3.5 3.5V9.33333H9.33333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "tax",
          title: serverLanguage?.tax ?? "Tax",
          href: "/report/tax",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 14C3.5 16.0767 4.11581 18.1068 5.26957 19.8335C6.42332 21.5602 8.0632 22.906 9.98182 23.7007C11.9004 24.4955 14.0116 24.7034 16.0484 24.2982C18.0852 23.8931 19.9562 22.8931 21.4246 21.4246C22.8931 19.9562 23.8931 18.0852 24.2982 16.0484C24.7034 14.0116 24.4955 11.9004 23.7007 9.98182C22.906 8.0632 21.5602 6.42332 19.8335 5.26957C18.1068 4.11581 16.0767 3.5 14 3.5C11.0646 3.51104 8.24713 4.65643 6.13667 6.69667L3.5 9.33333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3.5 3.5V9.33333H9.33333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "coupon",
          title: serverLanguage?.coupons ?? "Coupons",
          href: "/report/coupon",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 14C3.5 16.0767 4.11581 18.1068 5.26957 19.8335C6.42332 21.5602 8.0632 22.906 9.98182 23.7007C11.9004 24.4955 14.0116 24.7034 16.0484 24.2982C18.0852 23.8931 19.9562 22.8931 21.4246 21.4246C22.8931 19.9562 23.8931 18.0852 24.2982 16.0484C24.7034 14.0116 24.4955 11.9004 23.7007 9.98182C22.906 8.0632 21.5602 6.42332 19.8335 5.26957C18.1068 4.11581 16.0767 3.5 14 3.5C11.0646 3.51104 8.24713 4.65643 6.13667 6.69667L3.5 9.33333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3.5 3.5V9.33333H9.33333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "profitability",
          title: serverLanguage?.profitability_report ?? "Profitability Report",
          href: "/report/profitability-report",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "sales_by_category",
          title: serverLanguage?.sales_by_category ?? "Sales By Category",
          href: "/report/sales-by-category",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "peak_hour_report",
          title: serverLanguage?.sales_by_peak_hour ?? "Sales By Peak Hour",
          href: "/report/peak-hour-report",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "sales_by_payment_type",
          title: serverLanguage?.sales_by_payment_type ?? "Sales Payment Type",
          href: "/report/sales-by-payment-type",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "sales_coupon_discount",
          title:
            serverLanguage?.sales_coupon_discount ?? "Sales Coupon Discount",
          href: "/report/sales-coupon-discount",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "sales_by_items",
          title: serverLanguage?.sales_by_items ?? "Sales By Items",
          href: "/report/sales-by-item",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "sales_void_return",
          title: serverLanguage?.sales_void_return ?? "Sales Void Return",
          href: "/report/sales-void-return",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 8.16666H25.667V15.1667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 8.16666L15.7497 18.0833L9.91634 12.25L2.33301 19.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "transaction_detail_report",
          title:
            serverLanguage?.transaction_detail_report ??
            "Transaction Detail Report",
          href: "/report/transaction-detail-report",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.6667 5.83331H3.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.6667 14H3.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12.8333 22.1667H3.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17.5 21L19.8333 23.3334L24.5 18.6667"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "inventory",
          title: serverLanguage?.Bestseller ?? "BestSeller",
          href: "/report/bestseller",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.667 17.1033V19.0003C11.6626 19.4001 11.5556 19.792 11.3562 20.1384C11.1568 20.4849 10.8717 20.7744 10.5283 20.979C9.79932 21.5189 9.2063 22.2215 8.79639 23.0308C8.38648 23.8401 8.17097 24.7338 8.16699 25.641"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16.333 17.1033V19.0003C16.3374 19.4001 16.4444 19.792 16.6438 20.1384C16.8432 20.4849 17.1283 20.7744 17.4717 20.979C18.2007 21.5189 18.7937 22.2215 19.2036 23.0308C19.6135 23.8401 19.829 24.7338 19.833 25.641"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M21 10.5H22.75C23.5235 10.5 24.2654 10.1927 24.8124 9.64575C25.3594 9.09877 25.6667 8.3569 25.6667 7.58335C25.6667 6.80981 25.3594 6.06794 24.8124 5.52096C24.2654 4.97398 23.5235 4.66669 22.75 4.66669H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M4.66699 25.6667H23.3337"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 10.5C7 12.3565 7.7375 14.137 9.05025 15.4497C10.363 16.7625 12.1435 17.5 14 17.5C15.8565 17.5 17.637 16.7625 18.9497 15.4497C20.2625 14.137 21 12.3565 21 10.5V3.49998C21 3.19056 20.8771 2.89381 20.6583 2.67502C20.4395 2.45623 20.1428 2.33331 19.8333 2.33331H8.16667C7.85725 2.33331 7.5605 2.45623 7.34171 2.67502C7.12292 2.89381 7 3.19056 7 3.49998V10.5Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6.99967 10.5H5.24967C4.47613 10.5 3.73426 10.1927 3.18728 9.64575C2.6403 9.09877 2.33301 8.3569 2.33301 7.58335C2.33301 6.80981 2.6403 6.06794 3.18728 5.52096C3.73426 4.97398 4.47613 4.66669 5.24967 4.66669H6.99967"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "worstseller_report",
          title: serverLanguage?.worstseller_report ?? "WorstSeller Report",
          href: "/report/worstseller-report",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.667 19.8333H25.667V12.8333"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 19.8334L15.7497 9.91669L9.91634 15.75L2.33301 8.16669"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
      ],
    },
    {
      heading: serverLanguage?.inventory_reports ?? "Inventory Reports",
      reports: [
        {
          id: "warehouse_lowstocks",
          title: serverLanguage?.warehouse_lowstocks ?? "Warehouse Low Stock",
          href: "/report/warehouse-lowstocks",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 24.5V11.6667C21 11.3572 20.8771 11.0605 20.6583 10.8417C20.4395 10.6229 20.1428 10.5 19.8333 10.5H8.16667C7.85725 10.5 7.5605 10.6229 7.34171 10.8417C7.12292 11.0605 7 11.3572 7 11.6667V24.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 22.1667C25.6663 22.7855 25.4205 23.379 24.9829 23.8166C24.5453 24.2542 23.9518 24.5 23.333 24.5H4.66634C4.0475 24.5 3.45401 24.2542 3.01643 23.8166C2.57884 23.379 2.33301 22.7855 2.33301 22.1667V9.33334C2.33275 8.89394 2.45657 8.4634 2.69021 8.09127C2.92385 7.71913 3.25782 7.42053 3.65367 7.22984L12.9287 2.5935C13.2599 2.42225 13.6274 2.33289 14.0003 2.33289C14.3731 2.33289 14.7406 2.42225 15.0718 2.5935L24.3445 7.22984C24.7406 7.42037 25.0748 7.7189 25.3086 8.09104C25.5425 8.46319 25.6665 8.89381 25.6663 9.33334V22.1667Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 15.1667H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 19.8333H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "warehouse_stocks_level",
          title:
            serverLanguage?.warehouse_stocks_level ?? "Warehouse Stock Level",
          href: "/report/warehouse-stocklevel",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 24.5V11.6667C21 11.3572 20.8771 11.0605 20.6583 10.8417C20.4395 10.6229 20.1428 10.5 19.8333 10.5H8.16667C7.85725 10.5 7.5605 10.6229 7.34171 10.8417C7.12292 11.0605 7 11.3572 7 11.6667V24.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 22.1667C25.6663 22.7855 25.4205 23.379 24.9829 23.8166C24.5453 24.2542 23.9518 24.5 23.333 24.5H4.66634C4.0475 24.5 3.45401 24.2542 3.01643 23.8166C2.57884 23.379 2.33301 22.7855 2.33301 22.1667V9.33334C2.33275 8.89394 2.45657 8.4634 2.69021 8.09127C2.92385 7.71913 3.25782 7.42053 3.65367 7.22984L12.9287 2.5935C13.2599 2.42225 13.6274 2.33289 14.0003 2.33289C14.3731 2.33289 14.7406 2.42225 15.0718 2.5935L24.3445 7.22984C24.7406 7.42037 25.0748 7.7189 25.3086 8.09104C25.5425 8.46319 25.6665 8.89381 25.6663 9.33334V22.1667Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 15.1667H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 19.8333H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "warehouse_stocks_valuation",
          title:
            serverLanguage?.warehouse_stocks_valuation ??
            "Warehouse Stock Valuation",
          href: "/report/warehouse-stockvaluation",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 24.5V11.6667C21 11.3572 20.8771 11.0605 20.6583 10.8417C20.4395 10.6229 20.1428 10.5 19.8333 10.5H8.16667C7.85725 10.5 7.5605 10.6229 7.34171 10.8417C7.12292 11.0605 7 11.3572 7 11.6667V24.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 22.1667C25.6663 22.7855 25.4205 23.379 24.9829 23.8166C24.5453 24.2542 23.9518 24.5 23.333 24.5H4.66634C4.0475 24.5 3.45401 24.2542 3.01643 23.8166C2.57884 23.379 2.33301 22.7855 2.33301 22.1667V9.33334C2.33275 8.89394 2.45657 8.4634 2.69021 8.09127C2.92385 7.71913 3.25782 7.42053 3.65367 7.22984L12.9287 2.5935C13.2599 2.42225 13.6274 2.33289 14.0003 2.33289C14.3731 2.33289 14.7406 2.42225 15.0718 2.5935L24.3445 7.22984C24.7406 7.42037 25.0748 7.7189 25.3086 8.09104C25.5425 8.46319 25.6665 8.89381 25.6663 9.33334V22.1667Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 15.1667H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 19.8333H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "warehouse_inventory_usage",
          title:
            serverLanguage?.warehouse_inventory_usage ??
            "Warehouse Inventory Usage",
          href: "/report/warehouse-inventory-usage",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 24.5V11.6667C21 11.3572 20.8771 11.0605 20.6583 10.8417C20.4395 10.6229 20.1428 10.5 19.8333 10.5H8.16667C7.85725 10.5 7.5605 10.6229 7.34171 10.8417C7.12292 11.0605 7 11.3572 7 11.6667V24.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 22.1667C25.6663 22.7855 25.4205 23.379 24.9829 23.8166C24.5453 24.2542 23.9518 24.5 23.333 24.5H4.66634C4.0475 24.5 3.45401 24.2542 3.01643 23.8166C2.57884 23.379 2.33301 22.7855 2.33301 22.1667V9.33334C2.33275 8.89394 2.45657 8.4634 2.69021 8.09127C2.92385 7.71913 3.25782 7.42053 3.65367 7.22984L12.9287 2.5935C13.2599 2.42225 13.6274 2.33289 14.0003 2.33289C14.3731 2.33289 14.7406 2.42225 15.0718 2.5935L24.3445 7.22984C24.7406 7.42037 25.0748 7.7189 25.3086 8.09104C25.5425 8.46319 25.6665 8.89381 25.6663 9.33334V22.1667Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 15.1667H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 19.8333H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          id: "warehouse_inventory_turnover",
          title:
            serverLanguage?.warehouse_inventory_turnover ??
            "Warehouse Inventory Turnover",
          href: "/report/warehouse-turnover",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 24.5V11.6667C21 11.3572 20.8771 11.0605 20.6583 10.8417C20.4395 10.6229 20.1428 10.5 19.8333 10.5H8.16667C7.85725 10.5 7.5605 10.6229 7.34171 10.8417C7.12292 11.0605 7 11.3572 7 11.6667V24.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 22.1667C25.6663 22.7855 25.4205 23.379 24.9829 23.8166C24.5453 24.2542 23.9518 24.5 23.333 24.5H4.66634C4.0475 24.5 3.45401 24.2542 3.01643 23.8166C2.57884 23.379 2.33301 22.7855 2.33301 22.1667V9.33334C2.33275 8.89394 2.45657 8.4634 2.69021 8.09127C2.92385 7.71913 3.25782 7.42053 3.65367 7.22984L12.9287 2.5935C13.2599 2.42225 13.6274 2.33289 14.0003 2.33289C14.3731 2.33289 14.7406 2.42225 15.0718 2.5935L24.3445 7.22984C24.7406 7.42037 25.0748 7.7189 25.3086 8.09104C25.5425 8.46319 25.6665 8.89381 25.6663 9.33334V22.1667Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 15.1667H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 19.8333H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
      ],
    },
    {
      heading: serverLanguage?.customer_reports ?? "Customer Reports",
      reports: [
        {
          id: "customer",
          title: serverLanguage?.customers ?? "Customers",
          href: "/report/customer",
          svg: (
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 24.5V11.6667C21 11.3572 20.8771 11.0605 20.6583 10.8417C20.4395 10.6229 20.1428 10.5 19.8333 10.5H8.16667C7.85725 10.5 7.5605 10.6229 7.34171 10.8417C7.12292 11.0605 7 11.3572 7 11.6667V24.5"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M25.6663 22.1667C25.6663 22.7855 25.4205 23.379 24.9829 23.8166C24.5453 24.2542 23.9518 24.5 23.333 24.5H4.66634C4.0475 24.5 3.45401 24.2542 3.01643 23.8166C2.57884 23.379 2.33301 22.7855 2.33301 22.1667V9.33334C2.33275 8.89394 2.45657 8.4634 2.69021 8.09127C2.92385 7.71913 3.25782 7.42053 3.65367 7.22984L12.9287 2.5935C13.2599 2.42225 13.6274 2.33289 14.0003 2.33289C14.3731 2.33289 14.7406 2.42225 15.0718 2.5935L24.3445 7.22984C24.7406 7.42037 25.0748 7.7189 25.3086 8.09104C25.5425 8.46319 25.6665 8.89381 25.6663 9.33334V22.1667Z"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 15.1667H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 19.8333H21"
                stroke="#0092B8"
                stroke-width="2.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
      ],
    },
  ];

  
  return   <ReportsClient reportGroups={reportGroups} serverLanguage={serverLanguage} />
}
