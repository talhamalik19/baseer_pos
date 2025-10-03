import Invoice from "@/components/blocks/Invoice";
import { getOrdersByKey } from "@/lib/Magento";
import { magentoRestFetch } from "@/lib/Magento/restAPI";
import React from "react";
import style from "../../(auth)/consent/consent.module.scss"
import { getFeedbackAction } from "@/lib/Magento/actions";

export default async function InvoicePage({ searchParams }) {
  const id = await searchParams;
  const slug = id?.id;

  const ordersResponse = await getOrdersByKey(slug);
  
  const createReviewPayload = (orderData) => {
  const order = orderData?.data;
  
  if (!order) return null;

  return {
    data: {
      order: {
        order_key: slug,
        total: parseFloat(order.order_grandtotal),
        locale: "en_US",
        fulfillment: "offline",
        customer: {
          customer_email: order.customer_email,
          customer_phone: order.shipping_address?.telephone || "",
          previous_purchase_count: 0
        },
        items: order.items.map(item => ({
          sku: item.product_sku,
          name: item.product_name,
          price: parseFloat(item.item_price),
          quantity: parseFloat(item.item_qty_ordered)
        }))
      }
    }
  };
};

const reviewPayload = createReviewPayload(ordersResponse);
console.log("reviewPayload", reviewPayload);

const getFeedback = await getFeedbackAction(reviewPayload);
console.log(getFeedback)

// const submitFeedback = async (data) => {
//   "use server";
//   try {
//     const url = process.env.NEXT_PUBLIC_API_URL;

//     const response = await fetch(`${url}/rest/V1/order/review`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: typeof data === "string" ? data : JSON.stringify(data),
//       cache: "no-store",
//     });

//     const res = await response.json();
//     const success = res?.[0] === true;
//     return success;
//   } catch (error) {
//     console.error("Submit Feedback API Error:", error);
//     return false;
//   }
// };

return (
   <Invoice style={style} order={ordersResponse?.data} slug={slug}/>
  );
}
