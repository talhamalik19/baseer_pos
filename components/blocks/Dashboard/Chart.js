"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./dashboard.module.scss";
import { useMyContext } from "@/context/SidebarContext";
import { useEffect, useState } from "react";
import { getGraphStatsAction } from "@/lib/Magento/actions";
import SalesMap from "./SalesMap";

export default function Chart({
  jwt,
  graphStats,
  salesByCountries,
  serverLanguage,
}) {
  const { stats, setStats } = useMyContext();
  const [response, setResponse] = useState(
    graphStats?.data?.graphPoints?.map((item) => ({
      date: item?.X,
      order: parseFloat(item?.Y),
    }))
  );
  const [summary, setSummary] = useState(graphStats?.data?.revenue_details);

  useEffect(() => {
    async function getChartsDetail() {
      const result = await getGraphStatsAction(stats);
      const graphData = result?.data?.graphPoints?.map((item) => ({
        date: item?.X,
        order: parseFloat(item?.Y),
      }));
      setResponse(graphData);
      setSummary(result?.data?.revenue_details);
    }

    getChartsDetail();
  }, [stats]);

  return (
    <div className="section_padding">
      <div className={styles.chart}>
        <div className={styles.chartContainer}>
          <div className={styles.chart_head}>
            <div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.svg}
              >
                <path
                  d="M12 5.25H16.5V9.75"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.5 5.25L10.125 11.625L6.375 7.875L1.5 12.75"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h3 className={styles.chartTitle}>
                  {serverLanguage?.order_status ?? `Order Status`}
                </h3>
                <p>Order trends and performance</p>
              </div>
            </div>
            <div className={styles.legend}>
              <div>
                <p>Orders</p>
              </div>
              <ul>
                <li
                  onClick={() => setStats("MONTHLY")}
                  className={`${
                    stats == "MONTHLY" ? `${styles.legend_active}` : ""
                  }  `}
                >
                  {stats == "MONTHLY" && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.33337 1.33331V3.99998"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.6667 1.33331V3.99998"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12.6667 2.66669H3.33333C2.59695 2.66669 2 3.26364 2 4.00002V13.3334C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3334V4.00002C14 3.26364 13.403 2.66669 12.6667 2.66669Z"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 6.66669H14"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {serverLanguage?.Monthly ?? `MONTHLY`}
                </li>
                <li
                  onClick={() => setStats("YEARLY")}
                  className={`${
                    stats == "YEARLY" ? `${styles.legend_active}` : ""
                  }  `}
                >
                  {stats == "YEARLY" && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.33337 1.33331V3.99998"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.6667 1.33331V3.99998"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12.6667 2.66669H3.33333C2.59695 2.66669 2 3.26364 2 4.00002V13.3334C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3334V4.00002C14 3.26364 13.403 2.66669 12.6667 2.66669Z"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 6.66669H14"
                        stroke="white"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {serverLanguage?.Yearly ?? `YEARLY`}
                </li>
              </ul>
            </div>
          </div>

          <div className={`${styles.stats} grid_3`}>
            <div>
              <p className={styles.title}>Orders</p>
              <p className={styles.sum}>{summary?.quantity}</p>
            </div>
            <div>
              <p className={styles.title}>Revenue</p>
              <p className={styles.sum}>
                {Number(summary?.revenue || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className={styles.title}>Tax</p>
              <p className={styles.sum}>
                {Number(summary?.tax || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={response}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2B7FFF" />
                  <stop offset="100%" stopColor="#00B8DB" />
                </linearGradient>

                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B3BAF7" />
                  <stop offset="25%" stopColor="#C3C8F9" />
                  <stop offset="50%" stopColor="#D2D6FA" />
                  <stop offset="75%" stopColor="#E2E5FB" />
                  <stop offset="100%" stopColor="#F2F3FC" />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                stroke="none"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                stroke="none"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  color: "#111827",
                }}
                labelStyle={{ color: "#6B7280" }}
                itemStyle={{ color: "#111827" }}
              />

              <Area
                type="monotone"
                dataKey="order"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                fill="url(#fillGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <SalesMap
          salesByCountries={salesByCountries}
          serverLanguage={serverLanguage}
        />
      </div>
    </div>
  );
}
