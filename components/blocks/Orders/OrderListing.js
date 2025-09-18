"use client"
import Search from "@/components/shared/Search";
import { getAllOrders, saveMultipleOrders } from "@/lib/indexedDB";
import OrderList from "./OrderList";
import OrderFilterModal from "./OrderFilterModal";
import { useEffect, useState } from "react";
import { getOrderDetailsAction } from "@/lib/Magento/actions";
import style from "../Catalog/catalog.module.scss";

export default function OrderListing({ initialOrders, jwt, customerOrders, serverLanguage }) {
  const [isOnline, setIsOnline] = useState(false);
  const [combinedOrders, setCombinedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState();
  const [selectedCategory, setSelectedCategory] = useState("POS");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
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

  // Load persisted state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('orderListingState');
    if (savedState) {
      const { category, filters, filtersApplied, page, pageSize, pagination } = JSON.parse(savedState);
      setSelectedCategory(category || "POS");
      setFilters(filters || {
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
      setFiltersApplied(filtersApplied || false);
      setPage(page || 1);
      setPageSize(pageSize || 10);
      setPagination(pagination || undefined);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      category: selectedCategory,
      filters,
      filtersApplied,
      page,
      pageSize,
      pagination
    };
    localStorage.setItem('orderListingState', JSON.stringify(stateToSave));
  }, [selectedCategory, filters, filtersApplied, page, pageSize, pagination]);

  // Filter orders by category (POS starts with "POS" or "ORD")
  const filterByCategory = (orders, category) => {
    if (category === "All Orders") return orders;
    
    return orders.filter(order => {
      if (!order?.increment_id) return false;
      const isPosOrder = order.increment_id.startsWith("POS") || 
                         order.increment_id.startsWith("ORD");
      const isMobOrder = order.increment_id.startsWith("MOB");
      const isWebOrder = order.increment_id.startsWith("WEB")
      return category === "POS" ? isPosOrder : category === "Mobile" ? isMobOrder : isWebOrder;
    });
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    if (filtersApplied) {
      // Clear all filters when selecting category
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
      setFiltersApplied(false);
      setPagination(undefined);
      setPage(1);
      // Apply category to base orders
      setFilteredOrders(filterByCategory(combinedOrders, category));
    } else {
      // Just apply category filter
      setFilteredOrders(filterByCategory(combinedOrders, category));
    }
    setSelectedCategory(category);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch and combine orders
  useEffect(() => {
    const fetchOrders = async () => {
      const localOrders = await getAllOrders();
      const magentoOrders = initialOrders?.data || [];
  
      if (customerOrders) {
        const orders = customerOrders?.data || [];
        setCombinedOrders(orders);
        setFilteredOrders(filterByCategory(orders, selectedCategory));
      } else {
        let mergedOrders = [];
  
        if (isOnline) {
          // Combine and deduplicate orders
          const combined = [...localOrders, ...magentoOrders];
          const uniqueOrders = [
            ...new Map(
              combined?.map(order => [order.increment_id, order])
            ).values()
          ];
          mergedOrders = uniqueOrders;
  
          // Save recent Magento orders not in local DB
          const localIds = new Set(localOrders?.map(o => o.increment_id));
          const last24Hours = new Date();
          last24Hours.setHours(last24Hours.getHours() - 24);
          
          const recentMagentoOrders = magentoOrders.filter(order => {
            if (order.created_at) {
              const orderDate = new Date(order.created_at);
              return orderDate >= last24Hours && !localIds.has(order.increment_id);
            }
            return false;
          });
  
          if (recentMagentoOrders.length) {
            await saveMultipleOrders(recentMagentoOrders);
          }
        } else {
          mergedOrders = localOrders;
        }
  
        setCombinedOrders(mergedOrders);
        setFilteredOrders(filterByCategory(mergedOrders, selectedCategory));
      }
    };
  
    fetchOrders();
  }, [initialOrders, customerOrders, isOnline]);

  // Handle search results
  const handleSearchResults = (results) => {
    setSelectedCategory("All Orders");
    setFiltersApplied(false);
    setFilteredOrders(results);
  };

  // Apply advanced filters
  const handleApplyFilters = async(appliedFilters) => {
    setSelectedCategory("All Orders");
    setFilters(appliedFilters);
    setFiltersApplied(true);
    try {
      const response = await getOrderDetailsAction(appliedFilters, pageSize, page);
      if (response?.status == 200) {
        setFilteredOrders(response?.data);
        setPagination(response?.total_count);
      } else {
        setFilteredOrders([]);
      }
    } catch (error) { 
      console.error("Error applying filters:", error);
    } finally {
      setShowFilterModal(false);
    }
  };

  // Handle pagination with filters
  useEffect(() => {
    if (filtersApplied) {
      const fetchFilteredOrders = async () => {
        try {
          const response = await getOrderDetailsAction(filters, pageSize, page);
          if (response?.status == 200) {
            setFilteredOrders(response?.data);
            setPagination(response?.total_count);
          }
        } catch (error) {
          console.error("Error fetching filtered orders:", error);
        }
      };
      fetchFilteredOrders();
    }
  }, [page, pageSize, filtersApplied]);

  const handleCloseModal = () => {
    setShowFilterModal(false);
  };

  useEffect(() => {
    // Clear localStorage on component mount (which happens on refresh)
    localStorage.removeItem('orderListingState');
    
    // But we still want to persist during client-side navigation,
    // so we need to handle that differently
    const handleBeforeUnload = (e) => {
      // Only clear if this is a refresh (not client-side nav)
      if (performance.navigation?.type === 1) { // 1 means reload
        localStorage.removeItem('orderListingState');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <>
     <div className={style.orders_tab_block}>
  <ul className={style.orders_tab_list}>
    {[
      serverLanguage?.pos ?? "POS",
      serverLanguage?.web ?? "WEB",
      serverLanguage?.mobile ?? "Mobile",
      serverLanguage?.all_orders ?? "All Orders",
    ].map((category) => (
      <li
        key={category}
        className={`${style.orders_tab_item} ${
          category === selectedCategory ? style.active : ""
        }`}
        onClick={() => handleCategorySelect(category)}
      >
        {category}
      </li>
    ))}
  </ul>
</div>

      <div className="page_detail section_padding">
        <div className="search_row">
          <Search 
            jwt={jwt} 
            placeholder={serverLanguage?.search_orders ?? "Search Orders"} 
            orders={true} 
            orderItems={combinedOrders}
            setSearchResults={handleSearchResults}
            pagination={pagination}
            setPagination={setPagination}
          />
          <button 
            className="filter_cta"
            onClick={() => {
              if (filtersApplied) {
                // Clear all filters
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
                setSelectedCategory("All Orders");
                setFilteredOrders(combinedOrders);
                setPagination(undefined);
                setPage(1);
                setFiltersApplied(false);
              } else {
                setShowFilterModal(true);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {filtersApplied ? serverLanguage?.remove_filter ?? "Remove Filter" : serverLanguage?.apply_filter ?? "Apply Filter"}
          </button>
        </div>

        <OrderList 
          showCta={false} 
          items={filteredOrders} 
          pagination={pagination} 
          setPagination={setPagination} 
          page={page} 
          pageSize={pageSize} 
          setPageSize={setPageSize} 
          setPage={setPage}
          serverLanguage={serverLanguage}
        />
        
        <OrderFilterModal
          isOpen={showFilterModal}
          onClose={handleCloseModal}
          onApplyFilters={handleApplyFilters}
          initialFilters={filters}
        />
      </div>
    </>
  );
}