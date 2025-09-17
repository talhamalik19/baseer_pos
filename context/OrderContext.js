"use client"

import { createContext, useContext, useMemo, useState } from 'react'

const OrderContext = createContext()

const initialFilterState = {
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
}

export const OrderProvider = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState("POS")
  const [filters, setFilters] = useState(initialFilterState)
  const [filtersApplied, setFiltersApplied] = useState(false)

  const resetFilters = () => {
    setFilters(initialFilterState)
    setFiltersApplied(false)
  }

  const value = useMemo(() => ({
    selectedCategory,
    setSelectedCategory,
    filters,
    setFilters,
    filtersApplied,
    setFiltersApplied,
    resetFilters
  }), [selectedCategory, filters, filtersApplied])

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrderContext = () => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider')
  }
  return context
}