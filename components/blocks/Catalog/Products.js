"use client";

import Cards from "@/components/shared/Cards";
import Search from "@/components/shared/Search";
import React, { useEffect, useState, useMemo } from "react";
import { fetchProductsAction } from "@/lib/Magento/actions";

export default function Products({
  products,
  id,
  setProducts,
  handleAddToCart,
  currencySymbol,
  currency,
  language
}) {
  const [sort, setSort] = useState("");
  // Store only simple products in originalProducts
  // const originalProducts = useMemo(() => 
  //   (products || []).filter((item) => item?.__typename === "SimpleProduct"), 
  //   [products]
  // );
  const [displayedProducts, setDisplayedProducts] = useState(products);

  // Fetches products and filters to only keep simple products
  const getProducts = async () => {
    const res = await fetchProductsAction(id, sort, currency);
    const fetchedProducts = res?.items || [];
    // const simpleProducts = fetchedProducts.filter((item) => item?.__typename === "SimpleProduct");
    setProducts(fetchedProducts);
    setDisplayedProducts(fetchedProducts);
  };

  // Handles search while ensuring only simple products are shown
  const handleSearch = (results) => {
    if (results.length > 0) {
      // Filter search results to only show simple products
      // const simpleResults = results.filter((item) => item?.__typename === "SimpleProduct");
      setDisplayedProducts(results);
    } else {
      // When search is cleared, show all simple products
      setDisplayedProducts(displayedProducts);
    }
  };

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value;
    setSort(selectedValue);
  };

  // Fetch products when id or sort changes
  useEffect(() => {
    getProducts();
  }, [id, sort]);

  // Update displayed products when products prop changes
  // useEffect(() => {
  //   const simpleProducts = (products || []).filter((item) => item?.__typename === "SimpleProduct");
  //   setDisplayedProducts(simpleProducts);
  // }, [products]);

  return (
    <div className="page_detail section_padding">
      <div className="search_row">
        <Search
          isProduct={true}
          handleAddToCart={handleAddToCart}
          products={products} 
          placeholder={language?.search_products ?? "Search Products"}
          setProducts={handleSearch}
        />

        <div className="sort-button section_padding">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 7L8 2.5L3.5 7M7.996 15.5V2.5M21 17L16.5 21.5L12 17M16.496 8.5V21.5"
              stroke="#969696"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="sort-dropdown">
            <select onChange={handleSelectChange}>
              <option value="">{language?.sort_by ?? 'Sort by'}</option>
              <option value="sort: { name: ASC }">{language?.name_asc ?? 'Name (ASC)'}</option>
               <option value="sort: { name: DESC }">{language?.name_desc ?? 'Name (DESC)'}</option>
              <option value="sort: { price: ASC }">{language?.price_asc ?? 'Price (ASC)'}</option>
              <option value="sort: { price: DESC }">{language?.price_desc ?? 'Price (DESC)'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid_4">
        {displayedProducts?.length > 0 ? (
          displayedProducts.map((item, index) => (
            <Cards key={index} item={item} cards={false} currencySymbol={currencySymbol}/>
          ))
        ) : (
          <p className="no_prods">Loading</p>
        )}
      </div>
    </div>
  );
}