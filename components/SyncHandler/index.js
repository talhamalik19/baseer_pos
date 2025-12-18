"use client"

import { clearCart, clearOrders, getCartItems, getOrders, saveMultipleOrders, saveOrder, getSyncQueue, removeFromSyncQueue, saveProducts, saveCategories, saveCustomers } from "@/lib/indexedDB";
import { submitRefundAction, fetchProductsAction, getCategoriesAction, getCustomerAction } from "@/lib/Magento/actions";
import { useEffect, useState } from "react";

async function syncData() {
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: await getOrders() }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }

    const result = await response.json();
    const res = result?.res;
    if (res?.length > 0) {
      await clearOrders()
    }
    // Clear existing orders and save the newly fetched ones
    if (result.order && Array.isArray(result.order)) {
      await saveMultipleOrders(result.order);
    } else {
    }

    // Cache Global Data (Products & Categories)
    try {
      // Fetch all products (passing empty ID to get all)
      const productsRes = await fetchProductsAction("", "", "USD");
      if (productsRes?.items) {
        await saveProducts(productsRes.items);
      }

      // Fetch categories
      const categoriesRes = await getCategoriesAction();
      if (categoriesRes?.data) {
        // Categories are handled by Categories.js usually, but let's leave it for now as per previous step.
      }

      // Fetch Customers
      const customersRes = await getCustomerAction("", 1000, 1); // Fetch first 1000 customers for cache
      if (customersRes?.data) {
        await saveCustomers(customersRes.data);
      }
    } catch (cacheErr) {
      console.error("Error caching global data:", cacheErr);
    }

    // Process Sync Queue
    const queue = await getSyncQueue();
    for (const item of queue) {
      try {
        if (item.type === 'refund') {
          const res = await submitRefundAction(item.payload.actionData, item.payload.entity_id, item.payload.pos_code);
          if (res && !res.message) {
            await removeFromSyncQueue(item.id);
          }
        } else if (item.type === 'order') {
          // Orders are handled by the main sync block above (via ORDERS_STORE)
          // We can remove it from queue to avoid buildup, or keep it as a log.
          // For now, let's remove it to keep the queue clean.
          await removeFromSyncQueue(item.id);
        }
      } catch (err) {
        console.error("Error processing sync item:", item, err);
      }
    }

  } catch (error) {
    console.error("❌ Error syncing data:", error);
  }
}

export default function SyncHandler() {
  const [isOnline, setIsOnline] = useState(true);


  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    function handleOnline() {
      setIsOnline(true);
      syncData();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
