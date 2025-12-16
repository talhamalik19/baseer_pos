"use client"

import { clearCart, clearOrders, getCartItems, getOrders, saveMultipleOrders, saveOrder } from "@/lib/indexedDB";
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
