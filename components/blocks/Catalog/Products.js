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
  language,
  sort,
  setSort,
  displayedProducts,
  setDisplayedProducts
}) {
  // Store only simple products in originalProducts
  // const originalProducts = useMemo(() => 
  //   (products || []).filter((item) => item?.__typename === "SimpleProduct"), 
  //   [products]
  // );

  // Fetches products and filters to only keep simple products
  // const getProducts = async () => {
  //   const res = await fetchProductsAction(id, sort, currency);
  //   const fetchedProducts = res?.items || [];
  //   // const simpleProducts = fetchedProducts.filter((item) => item?.__typename === "SimpleProduct");
  //   setProducts(fetchedProducts);
  //   setDisplayedProducts(fetchedProducts);
  // };

  // Handles search while ensuring only simple products are shown


  // Fetch products when id or sort changes
  // useEffect(() => {
  //   getProducts();
  // }, [id, sort]);

  // Update displayed products when products prop changes
  // useEffect(() => {
  //   const simpleProducts = (products || []).filter((item) => item?.__typename === "SimpleProduct");
  //   setDisplayedProducts(simpleProducts);
  // }, [products]);

  return (
    <div className="page_detail section_padding">

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