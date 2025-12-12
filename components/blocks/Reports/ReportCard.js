import React from "react";
import Link from "next/link";
import styles from "./report.module.scss";
import { useRouter } from "next/navigation";

export default function ReportCard({ title, href, serverLanguage, svg, setIsLoading }) {
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(href);
  };

  return (
    <>
      <Link href={href} className={styles.report_card} onClick={handleClick}>
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
            className={styles.arrow_svg}
          >
            <path
              d="M6.75 13.5L11.25 9L6.75 4.5"
              stroke="#90A1B9"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Link>
    </>
  );
}
