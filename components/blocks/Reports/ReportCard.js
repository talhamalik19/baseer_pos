import React from "react";
import Link from "next/link";
import styles from "./report.module.scss";

export default function ReportCard({ title, href, serverLanguage, svg }) {
  return (
    <Link href={href} className={styles.report_card}>
      <div className={styles.card_content}>
        <h3 className={styles.card_title}>
          <span>{svg}</span>
          {title}
        </h3>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.arrow_svg}
        >
          <path
            d="M6.75 13.5L11.25 9L6.75 4.5"
            stroke="#90A1B9"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}
