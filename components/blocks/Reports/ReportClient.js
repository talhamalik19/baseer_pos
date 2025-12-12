"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./report.module.scss";
import ReportCard from "./ReportCard";
import Loading from "@/app/(main)/loading";

export default function ReportsClient({ reportGroups, serverLanguage }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <div className={"page_detail"}>
      {isLoading && <Loading />}
      {reportGroups.map((group) => (
        <div key={group.heading} className={styles.report_group}>
          <h2 className={styles.group_heading}>{group.heading}</h2>
          <div className={styles.grid_3}>
            {group.reports.map(({ id, title, href, svg }) => (
              <ReportCard
                key={id}
                title={title}
                href={href}
                svg={svg}
                serverLanguage={serverLanguage}
                setIsLoading={setIsLoading}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}