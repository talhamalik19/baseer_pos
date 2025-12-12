"use client";
import Search from "@/components/shared/Search";
import { getAllOrders, saveMultipleOrders } from "@/lib/indexedDB";
import OrderList from "./OrderList";
import OrderFilterModal from "./OrderFilterModal";
import { useEffect, useState } from "react";
import { getOrderDetailsAction } from "@/lib/Magento/actions";
import style from "../Catalog/catalog.module.scss";
import Link from "next/link";

export default function OrderListing({
  initialOrders,
  jwt,
  customerOrders,
  serverLanguage,
  params,
}) {
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
    dateTo: "",
  });
  const [loginDetail, setLoginDetail] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const login = JSON.parse(localStorage.getItem("loginDetail"))
    setLoginDetail(login);
  }, [])

  // Load persisted state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("orderListingState");
    if (savedState) {
      const { category, filters, filtersApplied, page, pageSize, pagination } =
        JSON.parse(savedState);
      setSelectedCategory(category || "POS");
      setFilters(
        filters || {
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
          dateTo: "",
        }
      );
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
      pagination,
    };
    localStorage.setItem("orderListingState", JSON.stringify(stateToSave));
  }, [selectedCategory, filters, filtersApplied, page, pageSize, pagination]);

  // Filter orders by category (POS starts with "POS" or "ORD")
  const filterByCategory = (orders, category) => {
    if (category === "All Orders") return orders;

    return orders.filter((order) => {
      if (!order?.increment_id) return false;
      const isPosOrder =
        order.increment_id.startsWith("POS") ||
        order.increment_id.startsWith("ORD");
      const isMobOrder = order.increment_id.startsWith("MOB");
      const isWebOrder = order.increment_id.startsWith("WEB");
      return category === "POS"
        ? isPosOrder
        : category === "Mobile"
        ? isMobOrder
        : isWebOrder;
    });
  };

  // Get paginated orders from local data
  const getPaginatedOrders = (orders, currentPage, currentPageSize) => {
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return orders.slice(startIndex, endIndex);
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    if (filtersApplied || searchTerm) {
      // Clear all filters and search when selecting category
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
        dateTo: "",
      });
      setFiltersApplied(false);
      setSearchTerm("");
      setPagination(undefined);
      setPage(1);
    }
    
    // Apply category filter and pagination
    const categoryFilteredOrders = filterByCategory(combinedOrders, category);
    const paginatedOrders = getPaginatedOrders(categoryFilteredOrders, 1, pageSize);
    
    setSelectedCategory(category);
    setFilteredOrders(paginatedOrders);
    setPagination(categoryFilteredOrders.length);
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
        // Apply pagination to initial orders
        const paginatedOrders = getPaginatedOrders(
          filterByCategory(orders, selectedCategory), 
          1, 
          pageSize
        );
        setFilteredOrders(paginatedOrders);
        setPagination(orders.length);
      } else {
        let mergedOrders = [];

        if (isOnline) {
          // Combine and deduplicate orders
          const combined = [...localOrders, ...magentoOrders];
          const uniqueOrders = [
            ...new Map(
              combined?.map((order) => [order.increment_id, order])
            ).values(),
          ];
          mergedOrders = uniqueOrders;

          // Save recent Magento orders not in local DB
          const localIds = new Set(localOrders?.map((o) => o.increment_id));
          const last24Hours = new Date();
          last24Hours.setHours(last24Hours.getHours() - 24);

          const recentMagentoOrders = magentoOrders.filter((order) => {
            if (order.created_at) {
              const orderDate = new Date(order.created_at);
              return (
                orderDate >= last24Hours && !localIds.has(order.increment_id)
              );
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
        // Apply pagination to initial orders
        const categoryFilteredOrders = filterByCategory(mergedOrders, selectedCategory);
        const paginatedOrders = getPaginatedOrders(categoryFilteredOrders, 1, pageSize);
        setFilteredOrders(paginatedOrders);
        setPagination(categoryFilteredOrders.length);
      }
    };

    fetchOrders();
  }, [initialOrders, customerOrders, isOnline]);

  // Handle search results - FIXED VERSION
  const handleSearchResults = async (searchTerm, currentPage = 1, currentPageSize = 10) => {
    setIsSearching(true);
    setSearchTerm(searchTerm);
    
    if (!searchTerm.trim()) {
      // If search is empty, show initial orders with pagination
      setSelectedCategory("All Orders");
      setFiltersApplied(false);
      
      const allOrders = filterByCategory(combinedOrders, "All Orders");
      const paginatedOrders = getPaginatedOrders(allOrders, currentPage, currentPageSize);
      
      setFilteredOrders(paginatedOrders);
      setPagination(allOrders.length);
      setPage(currentPage);
      setPageSize(currentPageSize);
      setIsSearching(false);
      return;
    }

    try {
      // Search via API with proper pagination
      const searchFilters = {
        email: "",
        phone: "",
        orderNumber: searchTerm,
        billName: "",
        status: "",
        isPosOrder: null,
        isWebOrder: null,
        isMobOrder: null,
        posCode: "",
        dateFrom: "",
        dateTo: "",
      };

      const response = await getOrderDetailsAction(searchFilters, currentPageSize, currentPage);
      
      if (response?.status === 200) {
        setFilteredOrders(response?.data || []);
        setPagination(response?.total_count || 0);
        setSelectedCategory("All Orders");
        setFiltersApplied(true);
        setPage(currentPage);
        setPageSize(currentPageSize);
      } else {
        setFilteredOrders([]);
        setPagination(0);
      }
    } catch (error) {
      console.error("Error searching orders:", error);
      setFilteredOrders([]);
      setPagination(0);
    } finally {
      setIsSearching(false);
    }
  };

  // Apply advanced filters
  const handleApplyFilters = async (appliedFilters) => {
    setSelectedCategory("All Orders");
    setFilters(appliedFilters);
    setFiltersApplied(true);
    setSearchTerm("");
    try {
      const response = await getOrderDetailsAction(
        appliedFilters,
        pageSize,
        page
      );
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

  // Handle pagination changes for local data
  useEffect(() => {
    if (!filtersApplied && !searchTerm) {
      // Handle pagination for local data (when no filters or search applied)
      const categoryFilteredOrders = filterByCategory(combinedOrders, selectedCategory);
      const paginatedOrders = getPaginatedOrders(categoryFilteredOrders, page, pageSize);
      setFilteredOrders(paginatedOrders);
      setPagination(categoryFilteredOrders.length);
    }
  }, [page, pageSize, combinedOrders, selectedCategory, filtersApplied, searchTerm]);

  // Handle pagination with filters (API calls)
  useEffect(() => {
    if ((filtersApplied || searchTerm) && !isSearching) {
      const fetchFilteredOrders = async () => {
        try {
          let response;
          if (searchTerm) {
            const searchFilters = {
              email: "",
              phone: "",
              orderNumber: searchTerm,
              billName: "",
              status: "",
              isPosOrder: null,
              isWebOrder: null,
              isMobOrder: null,
              posCode: "",
              dateFrom: "",
              dateTo: "",
            };
            response = await getOrderDetailsAction(searchFilters, pageSize, page);
          } else {
            response = await getOrderDetailsAction(filters, pageSize, page);
          }
          
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
  }, [page, pageSize, filtersApplied, searchTerm]);

  const handleCloseModal = () => {
    setShowFilterModal(false);
  };

  // Clear all filters and search
  const clearAllFilters = () => {
    const clearedFilters = {
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
      dateTo: "",
    };
    setFilters(clearedFilters);
    setSelectedCategory("All Orders");
    setSearchTerm("");
    
    // Reset to paginated local data
    const allOrders = filterByCategory(combinedOrders, "All Orders");
    const paginatedOrders = getPaginatedOrders(allOrders, 1, pageSize);
    setFilteredOrders(paginatedOrders);
    setPagination(allOrders.length);
    setPage(1);
    setFiltersApplied(false);
    localStorage.removeItem("orderListingState");
  };

  useEffect(() => {
    // Clear localStorage on component mount (which happens on refresh)
    localStorage.removeItem("orderListingState");

    // But we still want to persist during client-side navigation,
    // so we need to handle that differently
    const handleBeforeUnload = (e) => {
      // Only clear if this is a refresh (not client-side nav)
      if (performance.navigation?.type === 1) {
        // 1 means reload
        localStorage.removeItem("orderListingState");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <>
      <div className={style.orders_tab_block}>
        <ul className={style.orders_tab_list}>
          {[
            serverLanguage?.pos ?? "POS",
            loginDetail?.allow_web_orders == 1 && (serverLanguage?.web ?? "WEB"),
            loginDetail?.allow_mob_orders == 1 && (serverLanguage?.mobile ?? "Mobile"),
            (loginDetail?.allow_web_orders == 1 || loginDetail?.allow_mob_orders == 1) &&
              (serverLanguage?.all_orders ?? "All Orders"),
          ]
            // remove false values
            .filter(Boolean)
            .map((category) => (
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

      <div className="search_row">
        <Search
          jwt={jwt}
          placeholder={serverLanguage?.search_orders ?? "Search Orders"}
          orders={true}
          orderItems={combinedOrders}
          setSearchResults={handleSearchResults}
          pagination={pagination}
          setPagination={setPagination}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          isSearching={isSearching}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          {(filtersApplied || searchTerm) && (
            <button
              className="filter_cta"
              onClick={() => setShowFilterModal(true)}
              style={{ cursor: "pointer" }}
            >
              {serverLanguage?.edit_filter ?? "Edit Filter"}
            </button>
          )}
          <button
            className="filter_cta"
            onClick={() => {
              if (filtersApplied || searchTerm) {
                clearAllFilters();
              } else {
                setShowFilterModal(true);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {filtersApplied || searchTerm
              ? serverLanguage?.remove_filter ?? "Remove Filter"
              : serverLanguage?.apply_filter ?? "Apply Filter"}
          </button>
        </div>
      </div>
      <div className="page_detail section_padding">
        {params && (
          <Link href={'/customer'} className={style.back_main}>
            <div className={style.back}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.99967 12.6667L3.33301 8L7.99967 3.33334"
                  stroke="#0A0A0A"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12.6663 8H3.33301"
                  stroke="#0A0A0A"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <p>Back</p>
            </div>
            <p>Orders - POS Customer</p>
          </Link>
        )}

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
          isSearching={isSearching}
        />

        <OrderFilterModal
          isOpen={showFilterModal}
          onClose={handleCloseModal}
          onApplyFilters={handleApplyFilters}
          initialFilters={filters}
          loginDetail={loginDetail}
        />
      </div>
    </>
  );
}