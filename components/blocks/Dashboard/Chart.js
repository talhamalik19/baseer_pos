"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import styles from "./dashboard.module.scss"; 
import { useMyContext } from "@/context/SidebarContext";
import { useEffect, useState } from "react";
import { getGraphStatsAction } from "@/lib/Magento/actions";
import SalesMap from "./SalesMap";

export default function Chart({jwt, graphStats, salesByCountries, serverLanguage}) {
  const {stats, setStats} = useMyContext();
  const [response, setResponse] = useState(graphStats?.data?.graphPoints?.map((item) => ({
    date: item?.X,
    order: parseFloat(item?.Y)
  })));

  useEffect(() => {
    async function getChartsDetail() {
      const result = await getGraphStatsAction(stats);
      const graphData = result?.data?.graphPoints?.map((item) => ({
        date: item?.X,
        order: parseFloat(item?.Y)
      }));
      setResponse(graphData);
    }
  
    getChartsDetail();
  }, [stats]);
  return (
    <div className="section_padding">
      <div className={styles.chart}>
        <div className={styles.chartContainer}>
          <div className={styles.chart_head}>
            <h3 className={styles.chartTitle}>{serverLanguage?.order_status ?? `Order Status`}</h3>

            <div className={styles.legend}>
              <button onClick={()=>setStats('MONTHLY')} className={`${stats == "MONTHLY" ? `${styles.legend_active}` : ''}  `}>{serverLanguage?.Monthly ?? `MONTHLY`}</button>
              <button onClick={()=> setStats("YEARLY")} className={`${stats == "YEARLY" ? `${styles.legend_active}` : ''}  `}>{serverLanguage?.Yearly ?? `YEARLY`}</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={response}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="store"
                stroke="#007bff"
                fill="#007bff20"
              />
              <Line
                type="monotone"
                dataKey="order"
                stroke="#ff0000"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="store"
                stroke="#007bff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
             <SalesMap salesByCountries={salesByCountries} serverLanguage={serverLanguage}/>
        
      </div>
    </div>
  );
}
