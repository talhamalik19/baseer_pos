import React from 'react'
import Statistics from './Statistics'
import Chart from './Chart';
import RecentOrders from './RecentOrders';
import { getGraphStats, getSales, recentOrders } from '@/lib/Magento';

export default async function Dashboard({jwt, serverLanguage}) {

  const recentOrderItems = await recentOrders();
  const graphStats = await getGraphStats("YEARLY");
  const salesByCountries = await getSales();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
  
  return (
    <div className='page_detail'>
     <div className='top_row section_padding'>
      <div>
      <h1 className="pos_title">{serverLanguage?.point_of_sale ?? 'Juice Station Point of Sale'}</h1>
      <p className='pos_description'>{`Welcome back! Here's what's happening with your store today.`}</p>
      </div>
      <div className='page_detail_stats'>
        <p className='today'>Today</p>
        <p className='date'>{formattedDate}</p>
      </div>
        {/* <button>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.7847 6.84583L14.6002 7.27033C14.5714 7.33946 14.5228 7.39851 14.4604 7.44004C14.3981 7.48157 14.3249 7.50373 14.25 7.50373C14.1751 7.50373 14.1019 7.48157 14.0396 7.44004C13.9772 7.39851 13.9286 7.33946 13.8998 7.27033L13.7153 6.84583C13.3909 6.09488 12.7968 5.49277 12.0502 5.15833L11.481 4.90408C11.4119 4.87232 11.3534 4.82141 11.3124 4.75741C11.2714 4.6934 11.2496 4.61898 11.2496 4.54296C11.2496 4.46694 11.2714 4.39252 11.3124 4.32851C11.3534 4.26451 11.4119 4.2136 11.481 4.18183L12.0187 3.94258C12.7841 3.59862 13.3883 2.97425 13.707 2.19808L13.8967 1.73983C13.9246 1.66885 13.9732 1.60791 14.0362 1.56495C14.0992 1.522 14.1737 1.49902 14.25 1.49902C14.3263 1.49902 14.4008 1.522 14.4638 1.56495C14.5268 1.60791 14.5754 1.66885 14.6033 1.73983L14.793 2.19733C15.1114 2.97364 15.7153 3.59828 16.4805 3.94258L17.019 4.18258C17.0879 4.21444 17.1461 4.26534 17.187 4.32926C17.2279 4.39319 17.2496 4.46747 17.2496 4.54333C17.2496 4.6192 17.2279 4.69348 17.187 4.7574C17.1461 4.82133 17.0879 4.87222 17.019 4.90408L16.449 5.15758C15.7026 5.49236 15.1088 6.09473 14.7847 6.84583ZM4.5 3.74983C4.10218 3.74983 3.72064 3.90787 3.43934 4.18917C3.15804 4.47048 3 4.85201 3 5.24983V12.7498C3 13.1477 3.15804 13.5292 3.43934 13.8105C3.72064 14.0918 4.10218 14.2498 4.5 14.2498H13.5C13.8978 14.2498 14.2794 14.0918 14.5607 13.8105C14.842 13.5292 15 13.1477 15 12.7498V8.99983H16.5V12.7498C16.5 13.5455 16.1839 14.3085 15.6213 14.8712C15.0587 15.4338 14.2956 15.7498 13.5 15.7498H4.5C3.70435 15.7498 2.94129 15.4338 2.37868 14.8712C1.81607 14.3085 1.5 13.5455 1.5 12.7498V5.24983C1.5 4.45418 1.81607 3.69112 2.37868 3.12851C2.94129 2.5659 3.70435 2.24983 4.5 2.24983H9.75V3.74983H4.5Z" fill="white"/>
        </svg>
        Generate QR Code</button> */}
     </div>
     <Statistics serverLanguage={serverLanguage}/>
     
     <Chart jwt={jwt} graphStats={graphStats} salesByCountries={salesByCountries} serverLanguage={serverLanguage}/>
     <RecentOrders items={recentOrderItems?.data} showCta={true} serverLanguage={serverLanguage}/>
    </div>
  )
}
