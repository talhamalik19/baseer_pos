import { clearOrders } from "@/lib/indexedDB";
import { getOrders } from "@/lib/Magento";
import { placeOrders } from "@/lib/Magento/restAPI";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { order } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt")?.value;
    let res;
    // Place orders only if there are any
    if (Array.isArray(order) && order.length > 0) {
      res = await placeOrders(token, order);
    }

    // Get current time and 24 hours ago in ISO format
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const latestOrders = await getOrders({
      email: "",
      phone: "",
      orderNumber: "",
      billName: "",
      status: "",
      isPosOrder: null,
      isWebOrder:null,
      isMobOrder: null,
      posCode: "",
      dateFrom: twentyFourHoursAgo.toISOString(),
      dateTo: now.toISOString(),
    });

    if (latestOrders?.data) {
      return NextResponse.json({
        message: "Sync completed",
        order: latestOrders.data,
        res: res,
      });
    }

    return NextResponse.json({
      message: "Sync completed, but failed to fetch latest orders",
      error: latestOrders?.errors || "Unknown error",
    }, { status: 500 });

  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({
      message: "Error syncing data",
      error: error?.message || "Unknown error",
    }, { status: 500 });
  }
}
