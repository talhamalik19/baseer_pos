import React from 'react';
import Link from 'next/link';
import styles from './report.module.scss';

export default function ReportCard({ title, href, serverLanguage }) {
  return (
    <Link href={href} className={styles.report_card}>
      <div className={styles.card_content}>
        <h3 className={styles.card_title}>{title}</h3>
      </div>
    </Link>
  );
}
