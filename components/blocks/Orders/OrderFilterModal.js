"use client"

import { useState } from 'react';
import styles from '../Employees/employeeModal.module.scss';

const OrderFilterModal = ({ isOpen, onClose, onApplyFilters, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters || {
    email: "",
    phone: "",
    orderNumber: "",
    billName: "",
    status: "",
    isPosOrder: null,
    isWebOrder: null,
    isMobOrder: null,
    posCode: "",
    dateFrom: "",
    dateTo: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOrderTypeChange = (type) => {
    setFilters(prev => {
      // Reset all order type filters when selecting "All Orders"
      if (type === 'all') {
        return {
          ...prev,
          isPosOrder: null,
          isWebOrder: null,
          isMobOrder: null
        };
      }
      
      // For POS orders
      if (type === 'pos') {
        return {
          ...prev,
          isPosOrder: true,
          isWebOrder: false,
          isMobOrder: false
        };
      }
      
      // For Web orders
      if (type === 'web') {
        return {
          ...prev,
          isPosOrder: false,
          isWebOrder: true,
          isMobOrder: false
        };
      }
      
      // For Mobile orders
      if (type === 'mob') {
        return {
          ...prev,
          isPosOrder: false,
          isWebOrder: false,
          isMobOrder: true
        };
      }
      
      return prev;
    });
  };

  // Determine which radio button should be checked
  const getOrderTypeChecked = (type) => {
    if (type === 'all') {
      return filters.isPosOrder === null && filters.isWebOrder === null && filters.isMobOrder === null;
    }
    if (type === 'pos') {
      return filters.isPosOrder === true;
    }
    if (type === 'web') {
      return filters.isWebOrder === true;
    }
    if (type === 'mob') {
      return filters.isMobOrder === true;
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add hardcoded times to date filters
    const formattedFilters = {
      ...filters,
      dateFrom: filters.dateFrom ? `${filters.dateFrom} 00:00:00` : "",
      dateTo: filters.dateTo ? `${filters.dateTo} 23:59:59` : ""
    };
    
    onApplyFilters(formattedFilters);
  };

  const handleReset = () => {
    setFilters({
      email: "",
      phone: "",
      orderNumber: "",
      billName: "",
      status: "",
      isPosOrder: null,
      isWebOrder: null,
      isMobOrder: null,
      posCode: "",
      dateFrom: "",
      dateTo: ""
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Filter Orders</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="text"
                  name="email"
                  value={filters.email}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="Customer email"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={filters.phone}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Order Number</label>
                <input
                  type="text"
                  name="orderNumber"
                  value={filters.orderNumber}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="Order ID"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Customer Name</label>
                <input
                  type="text"
                  name="billName"
                  value={filters.billName}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="Customer name"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                  className={styles.formControl}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="complete">Complete</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>POS Code</label>
                <input
                  type="text"
                  name="posCode"
                  value={filters.posCode}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="POS code"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Order Type</label>
              <div className={styles.radioGroup}>
                <label>
                  <input
                    type="radio"
                    name="orderType"
                    checked={getOrderTypeChecked('all')}
                    onChange={() => handleOrderTypeChange('all')}
                  />
                  All Orders
                </label>
                <label>
                  <input
                    type="radio"
                    name="orderType"
                    checked={getOrderTypeChecked('pos')}
                    onChange={() => handleOrderTypeChange('pos')}
                  />
                  POS Orders
                </label>
                <label>
                  <input
                    type="radio"
                    name="orderType"
                    checked={getOrderTypeChecked('web')}
                    onChange={() => handleOrderTypeChange('web')}
                  />
                  Web Orders
                </label>
                <label>
                  <input
                    type="radio"
                    name="orderType"
                    checked={getOrderTypeChecked('mob')}
                    onChange={() => handleOrderTypeChange('mob')}
                  />
                  Mobile Orders
                </label>
              </div>
            </div>

                   <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleChange}
                  className={styles.formControl}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleChange}
                  className={styles.formControl}
                />
              </div>
            </div>

            <div className={styles.formFooter}>
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={handleReset}
              >
                Reset Filters
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderFilterModal;