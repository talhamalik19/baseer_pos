'use client';
import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import ReactTooltip from 'react-tooltip';
import styles from './dashboard.module.scss';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const SalesMap = ({ salesByCountries, serverLanguage }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  // Normalize and process country data using names
  const countryDetails = useMemo(() => {
    const details = {};
    salesByCountries?.data?.forEach(item => {
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
    return salesByCountries?.data?.filter(item => item.order_count > 0) || [];
  }, [salesByCountries]);

  if (!countriesWithOrders.length) {
    return (
      <div className={styles.salesMap}>
        <div className={styles.noData}>
          {serverLanguage?.no_sales_data || 'No sales data by country available'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.salesMap}>
      <h3 className={styles.salesMapTitle}>
        {serverLanguage?.sales_by_locations || 'Sales by Locations'}
      </h3>

      <div className={styles.mapContainer}>
        <div className={styles.vectorMap} data-tip="">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 150, center: [20, 20] }}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name?.trim().toLowerCase();
                    const country = countryDetails[countryName];
                    const hasOrders = country?.sales > 0;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        className={hasOrders ? styles.highlighted : ''}
                        fill={hasOrders ? '#ff5233' : '#f0f0f0'}
                        stroke={hasOrders ? '#d83400' : '#ddd'}
                        strokeWidth={hasOrders ? 1.2 : 0.5}
                        onMouseEnter={() => {
                          if (country) {
                            setTooltipContent(
                              `${country.name}: ${country.sales} ${serverLanguage?.orders || 'orders'} (${country.percentage}%)`
                            );
                          }
                        }}
                        onMouseLeave={() => setTooltipContent('')}
                        style={{
                          default: { outline: 'none' },
                          hover: {
                            fill: hasOrders ? '#e03d1f' : '#e6e6e6',
                            outline: 'none',
                            cursor: 'pointer'
                          },
                          pressed: {
                            fill: hasOrders ? '#b52c15' : '#ccc',
                            outline: 'none'
                          }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          {/* <ReactTooltip html>{tooltipContent}</ReactTooltip> */}
        </div>
      </div>

      <div className={styles.countryStats}>
        {countriesWithOrders.map(item => (
          <div key={item.country_id} className={styles.countryStat}>
            <h4>{item.country_name}</h4>
            <p>
              {item.order_count} {serverLanguage?.orders || 'orders'} ({item.order_percentage}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SalesMap);
