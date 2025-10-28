"use client";
import { getCustomers } from '@/lib/Magento';
import React, { useState, useEffect } from 'react';
import employeeStyles from '../Employees/employeeDetail.module.scss';
import dashboardStyles from '../Dashboard/dashboard.module.scss';
import CustomerAction from './CutsomerAction';
import Search from '@/components/shared/Search';
import Pagination from '@/components/shared/Pagination';
import { getCustomerAction } from '@/lib/Magento/actions';

export default function EmployeeDetail({ jwt, customer, total_count, serverLanguage }) {
  const [originalCustomers, setOriginalCustomers] = useState(customer?.data || []);
  const [displayedCustomers, setDisplayedCustomers] = useState(customer?.data || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(total_count || 0);
  const responseMessage = "";

  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch customers when page changes
  useEffect(() => {
    if (totalCount <= pageSize) return; // Don't fetch if all data is already loaded
    
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const res = await getCustomerAction("", pageSize, currentPage);
        if (res.data) {
          setDisplayedCustomers(res.data);
          setOriginalCustomers(prev => [...prev, ...res.data]); // Keep original data for search
          setTotalCount(res.total_count || totalCount);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [currentPage]);

  // Handle customer search results
  const handleCustomerSearch = (results) => {
    setDisplayedCustomers(results.length > 0 ? results : originalCustomers);
    // When searching, we want to show all matching results without pagination
    setCurrentPage(1);
  };

  return (
    <>
    <div className='customer_search'>
      <Search 
  placeholder={serverLanguage?.search_customer ?? 'Search Customer'} 
  isCustomer={true} 
  customer={originalCustomers} 
  setCustomer={handleCustomerSearch}
  setPagination={setTotalCount}
  originalCustomers={originalCustomers}  // Add this
  total_count={totalCount}  // Add this
/>
</div>
    <div className="page_detail">
      <p>{responseMessage}</p>
      
      <div className={dashboardStyles.orders}>
        <div className={dashboardStyles.order_head}>
          <h2 className={dashboardStyles.title}>
            {serverLanguage?.customer_details ?? 'Customer Details'}
          </h2>
        </div>
        
        <div className={dashboardStyles.table_block}>
          {isLoading ? (
            <div>{serverLanguage?.loading_customers ?? 'Loading customers...'}</div>
          ) : (
            <>
              <table className={dashboardStyles.table}>
                <thead>
                  <tr>
                    <th>{serverLanguage?.customer_id ?? 'CustomerID'}</th>
                    <th>{serverLanguage?.first_name ?? 'First Name'}</th>
                    <th>{serverLanguage?.last_name ?? 'Last Name'}</th>
                    <th>{serverLanguage?.email ?? 'Email'}</th>
                    <th>{serverLanguage?.actions ?? 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCustomers.length > 0 ? (
                    displayedCustomers.map((cust) => (
                      <tr key={cust?.customer_id}>
                        <td>{cust?.customer_id}</td>
                        <td className={dashboardStyles.name}>{cust?.firstname}</td>
                        <td>{cust?.lastname}</td>
                        <td>{cust?.email}</td>
                        <CustomerAction
                          customer={cust}
                          jwt={jwt}
                          responseMessage={responseMessage}
                          styles={dashboardStyles}
                          serverLanguage={serverLanguage}
                        />
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={dashboardStyles.no_results} colSpan="5">
                        {serverLanguage?.no_customers_found ?? 'No customers found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalCount > pageSize && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  serverLanguage={serverLanguage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}