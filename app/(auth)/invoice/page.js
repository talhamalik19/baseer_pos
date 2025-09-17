import Invoice from "@/components/blocks/Invoice";
import { getOrdersByKey } from "@/lib/Magento";
import { magentoRestFetch } from "@/lib/Magento/restAPI";
import React from "react";
import style from "../consent/consent.module.scss"

export default async function InvoicePage({ searchParams }) {
  const id = await searchParams;
  const slug = id?.id;

  const ordersResponse = await getOrdersByKey(slug);
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
console.log("20250917_qpunlq2w", ordersResponse)

return (
   <Invoice style={style} order={ordersResponse?.data} slug={slug}/>
  );
}
