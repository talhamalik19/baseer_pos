"use client";
import React, { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import styles from "./dashboard.module.scss";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const SalesMap = ({ salesByCountries, serverLanguage }) => {
  const [tooltip, setTooltip] = useState({
    content: "",
    x: 0,
    y: 0,
    visible: false,
    color: "",
  });

  const colorPalette = [
    "#2B7FFF",
    "#00B8DB",
    "#00BC7D",
    "#FFB800",
    "#FF6B6B",
    "#9B51E0",
    "#F2994A",
  ];

  const countryDetails = useMemo(() => {
    const details = {};
    salesByCountries?.data?.forEach((item) => {
      const nameKey = item.country_name?.trim().toLowerCase();
      details[nameKey] = {
        name: item.country_name,
        sales: item.order_count,
        percentage: item.order_percentage,
      };
    });
    return details;
  }, [salesByCountries]);

  const countriesWithOrders = useMemo(() => {
    return salesByCountries?.data?.filter((item) => item.order_count > 0) || [];
  }, [salesByCountries]);

  const countryColors = useMemo(() => {
    const colors = {};
    countriesWithOrders.forEach((item, index) => {
      colors[item.country_name.trim().toLowerCase()] =
        colorPalette[index % colorPalette.length];
    });
    return colors;
  }, [countriesWithOrders]);

  if (!countriesWithOrders.length) {
    return (
      <div className={styles.salesMap}>
        <div className={styles.noData}>
          {serverLanguage?.no_sales_data ||
            "No sales data by country available"}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.salesMap}>
      <div className={styles.sales_head}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 1.5C7.07418 3.52212 6 6.20756 6 9C6 11.7924 7.07418 14.4779 9 16.5C10.9258 14.4779 12 11.7924 12 9C12 6.20756 10.9258 3.52212 9 1.5Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1.5 9H16.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div>
          <h3 className={styles.salesMapTitle}>
            {serverLanguage?.sales_by_locations || "Sales by Locations"}
          </h3>
          <p>Revenue by location</p>
        </div>
      </div>

      <div className={styles.mapContainer}>
        <div className={styles.vectorMap}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 150, center: [20, 20] }}
            style={{ width: "100%", height: "300px" }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name?.trim().toLowerCase();
                  const country = countryDetails[countryName];
                  const hasOrders = country?.sales > 0;
                  const fillColor = hasOrders
                    ? countryColors[countryName] || "#2B7FFF"
                    : "#F3F4F6";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={hasOrders ? fillColor : "#E5E7EB"}
                      strokeWidth={hasOrders ? 0.8 : 0.4}
                      onMouseEnter={(e) => {
                        if (country) {
                          const countryColor =
                            countryColors[countryName] || "#2B7FFF";

                          setTooltip({
                            content: (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{ marginRight: "6px" }}
                                >
                                  <path
                                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                                    fill="white"
                                  />
                                </svg>
                                {country.name}
                              </>
                            ),
                            x: e.clientX,
                            y: e.clientY,
                            visible: true,
                            color: countryColor,
                          });
                        }
                      }}
                      onMouseMove={(e) =>
                        setTooltip((prev) => ({
                          ...prev,
                          x: e.clientX,
                          y: e.clientY,
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltip({
                          content: "",
                          x: 0,
                          y: 0,
                          visible: false,
                          color: "",
                        })
                      }
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: fillColor,
                          opacity: 0.8,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {tooltip.visible && (
            <div
              className={styles.mapTooltip}
              style={{
                position: "fixed",
                top: tooltip.y + 10,
                left: tooltip.x + 10,
                background: tooltip.color,
                pointerEvents: "none",
              }}
            >
              {tooltip.content}
            </div>
          )}
        </div>
      </div>

      <div className={styles.countryStats}>
        {countriesWithOrders.map((item) => (
          <div key={item.country_id} className={styles.countryStat}>
            <div>
              <div>
                <h4>{item.country_name}</h4>
                <p>
                  {item.order_count} {serverLanguage?.orders || "orders"}
                </p>
              </div>
            </div>
            <div>
              <progress id="file" value={item.order_percentage} max="100" />
              <p>{item.order_percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SalesMap);
