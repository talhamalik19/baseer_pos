import { cookies } from "next/headers";

export async function magentoRestFetch({
  endpoint,
  method = "POST",
  body,
  headers = {},
}) {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    };
    const response = await fetch(`${url}/rest/${endpoint}`, options);
    const result = await response.json();
    if (!response.ok) {
      return { status: response.status, message: result.message };
    }

    return result;
  } catch (error) {
    console.error("Magento REST API Error:", error);
    throw error;
  }
}

export async function loginAdminMagento({ email, password }) {
  try {
    const data = await magentoRestFetch({
      endpoint: "V1/integration/admin/token",
      body: { username: email, password },
      method: "POST",
    });
    if (!data) throw new Error("Invalid login credentials");
    // 🔹 Return Token
    return { data };
  } catch (error) {
    console.error("Admin Login Failed:", error);
    throw error;
  }
}

export async function getOrders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  try {
    const orders = await magentoRestFetch({
      endpoint:
        "V1/orders?searchCriteria[currentPage]=1&searchCriteria[pageSize]=1000",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function submitRefundOrder(actionData, entity_id, pos_code) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const storeCode = cookieStore.get("store_code")?.value || "default";
  try {
    const data = await magentoRestFetch({
      endpoint: `${storeCode}/V1/order/${entity_id}/refund?pos_code=${pos_code}`,
      method: "POST",
      body: actionData,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to Create Credit Memo:", error);
    throw error;
  }
}

export async function submitCancelOrder(actionData) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  try {
    const data = await magentoRestFetch({
      endpoint: "V1/fme/cancelOrder/en",
      method: "POST",
      body: {
        reason: actionData?.reason,
        comment: actionData?.comment,
        order_id: actionData?.orderId,
      },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

// export async function placeOrders(jwt, rawOrders) {

//   const formattedOrders = rawOrders.map(order => ({
//     customer_phone: order?.mailto || "",
//     customer_email: order?.customer_email || "",
//     increment_id: order?.increment_id || "",
//     pos_device_info: order?.pos_device_info || "",
//     store_id: order?.store_id || 1,
//     items: order?.items?.map(item => {
//       const baseItem = {
//         product_id: item.product_id,
//         qty: item.qty,
//         product_type: item.product_type,
//         price: item.product_price?.toString() || undefined,
//       };

//       if (item.super_attribute?.custom_options) {
//         return {
//           ...baseItem,
//           custom_options: item.super_attribute.custom_options,
//         };
//       }

//       if (item.super_attribute && !item.super_attribute) {
//         return {
//           ...baseItem,
//           super_attribute: item.super_attribute,
//         };
//       }

//       return baseItem;
//     }),
//     payment_method: order?.payment_method || "",
//     order_grandtotal: order?.order_grandtotal || "",
//     discount: order?.discount?.toString() || "0"
//   }));

//   const jsonData = JSON.stringify(JSON.stringify(formattedOrders[0]));

//   try {
//     const data = await magentoRestFetch({
//       endpoint: 'fme/insertOrderDetails',
//       method: 'POST',
//       body: jsonData,
//       headers: {
//         Authorization: `Bearer ${jwt}`
//       }
//     });

//     return data;
//   } catch (error) {
//     console.error('Failed to fetch orders:', error);
//     throw error;
//   }
// }

// ----------------
//old code
export async function placeOrders(jwt, rawOrders) {
  const cookieStore = await cookies();
  const currency_code = cookieStore.get("currency_code")?.value;
  function formatDate(date) {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  const formattedOrders = rawOrders.map((order) => {
    // Calculate order subtotal from items
    const orderSubtotal =
      order.items?.reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.qty;
      }, 0) || 0;

    return {
      customer_phone: order.customer_phone || "",
      customer_email: order.customer_email || "",
      // order_key: order?.order_key,
      increment_id: order.increment_id || "",
      pos_device_info: order.pos_device_info || "",
      admin_user: order.admin_user,
      store_id: order.store_id || 1,
      customer_firstname: "POS",
      customer_last_name: "Customer",
      items: order.items?.map((item) => ({
        product_id: item.product_id,
        product_sku: item.product_sku,
        qty: item.qty,
        product_type: item?.product_type || "simple",
        price: item.price,
        original_price: item.original_price || item.price,
        row_total: item?.row_total != null ? parseFloat(item.row_total).toFixed(2) : "0.00",
        discount_percent: item.discount_percent || 0,
        tax_percent: item.tax_percent || 0,
        price_incl_tax: item?.price_incl_tax != null ? parseFloat(item.price_incl_tax).toFixed(2) : "0.00",
        row_total_incl_tax: item?.row_total_incl_tax != null ? parseFloat(item.row_total_incl_tax).toFixed(2) : "0.00",
        ...(item.super_attribute && { super_attribute: item.super_attribute }),
        ...(item.custom_options && { custom_options: item.custom_options }),
        super_attribute: item?.super_attributes?.super_attributes || {},
        custom_options: item?.super_attributes?.custom_attributes || {},
      })),

      payment_method: order.payment_method || "cashondelivery",
      order_subtotal: orderSubtotal.toFixed(2),
      order_grandtotal: order.order_grandtotal || orderSubtotal.toFixed(2),
      discount: order.discount?.toString() || "0",
      order_date: order.order_date || formatDate(new Date()),
      currency_code: currency_code ?? "USD",
      order_key: order?.order_key,
      create_acc: order?.create_acc ? 1 : 0,
      fbr_invoice_id: order?.fbr_invoice_id,
      fbr_tax_percent: order?.fbr_tax_percent
    };
  });
  const jsonData = JSON.stringify(JSON.stringify(formattedOrders));
  console.log("jsonData", jsonData);
  // try {
  //   const data = await magentoRestFetch({
  //     endpoint: "V1/fme/insertOrderDetails",
  //     method: "POST",
  //     body: jsonData,
  //     headers: {
  //       Authorization: `Bearer ${jwt}`,
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   return data;
  // } catch (error) {
  //   console.error("Failed to fetch orders:", error);
  //   throw error;
  // }
}

// ----------------

// export async function placeOrders(jwt, rawOrders) {
//   let formattedOrders = [];

//   // Process each order
//   rawOrders.forEach(order => {
//     let items = [];

//     // Process items
//     if (order?.items) {
//       order.items.forEach(item => {
//         let processedItem = {
//           product_id: item.product_id,
//           qty: item.qty,
//           product_type: item.product_type,
//           price: item.product_price?.toString() || undefined,
//         };

//         if (item.super_attribute?.custom_options) {
//           processedItem.custom_options = item.super_attribute.custom_options;
//         } else if (item.super_attribute) {
//           processedItem.super_attribute = item.super_attribute;
//         }

//         items.push(processedItem);
//       });
//     }

//     // Create formatted order object
//     let formattedOrder = {
//       customer_phone: order?.mailto || "",
//       customer_email: order?.customer_email || "",
//       increment_id: order?.increment_id || "",
//       pos_device_info: order?.pos_device_info || "",
//       store_id: order?.store_id || 1,
//       customer_firstname: "POS",
//       customer_last_name: "Customer",
//       items: items,
//       payment_method: order?.payment_method || "",
//       order_grandtotal: order?.order_grandtotal || "",
//       discount: order?.discount?.toString() || "0"
//     };

//     formattedOrders.push(formattedOrder);
//   });

//   // Keep the original stringify approach as requested
//   const jsonData = JSON.stringify(JSON.stringify(formattedOrders));

//   try {
//     const data = await magentoRestFetch({
//       endpoint: 'fme/insertOrderDetails',
//       method: 'POST',
//       body: jsonData,
//       headers: {
//         Authorization: `Bearer ${jwt}`
//       }
//     });

//     return data;
//   } catch (error) {
//     console.error('Failed to fetch orders:', error);
//     throw error;
//   }
// }

export async function addEmployee(actionData) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  try {
    const data = await magentoRestFetch({
      endpoint: "V1/pos/admin-user/register",
      method: "POST",
      body: {
        id: actionData?.id,
        username: actionData?.username,
        email: actionData?.email,
        firstName: actionData?.firstname,
        lastName: actionData?.lastname,
        password: actionData?.password,
        storeIds: [actionData?.storeIds],
        pos_code: actionData?.pos_code,
        acl: actionData?.acl,
      },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function savePOSData(actionData) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const data = await magentoRestFetch({
      endpoint: "V1/posdetail/save",
      method: "POST",
      body: actionData,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function getPOSData(code) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const data = await magentoRestFetch({
      endpoint: "V1/posdetail/get",
      method: "POST",
      body: { pos_code: code },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function getPOSRole(username) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const data = await magentoRestFetch({
      endpoint: "V1/pos/role",
      method: "POST",
      body: { username: username },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function getOrdersByDate(from_date, to_date) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const data = await magentoRestFetch({
      endpoint: "V1/fme/getOrderByDate",
      method: "POST",
      body: { from_date: from_date, to_date: to_date },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function getWarehouseCodes(username) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const data = await magentoRestFetch({
      endpoint: "V1/pos/getPosCodes",
      method: "POST",
      body: { username: username },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}
export async function getSalesReport(apiUrl) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const data = await magentoRestFetch({
      endpoint: apiUrl,
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function sendOrderInvoice(id) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const storeCode = cookieStore.get("store_code")?.value || "default";
    const data = await magentoRestFetch({
      endpoint: `${storeCode}/V1/invoices/${id}/emails`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function submitConsent(payload) {
  try {
    const data = await magentoRestFetch({
      endpoint: `V1/smartreceipt/updateConsent`,
      method: "POST",
      body: payload
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function getConsent(email, phone) {
  try {
    const data = await magentoRestFetch({
      endpoint: `V1/smartreceipt/getConsent?customer_email=${email}&phone_number=${phone}`,
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function getFeedback(payload) {
  try {
    const data = await magentoRestFetch({
      endpoint: `V1/smart-feedback/generate`,
      method: "POST",
      body: payload
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

export async function submitFeedback(payload) {
  try {
    const data = await magentoRestFetch({
      endpoint: `V1/smart-feedback/submit`,
      method: "POST",
      body: payload
    });
    return data;
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    throw error;
  }
}

export async function getBannerDetails(pos) {
  try {
    const data = await magentoRestFetch({
      endpoint: `V1/receiptbanners/by-pos/${pos}`,
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Failed to get banner details:", error);
    throw error;
  }
}

export async function getWarehouseDetail(id) {
  try {
    const data = await magentoRestFetch({
      endpoint: `V1/getWarehoueseDetails?warehouse_code=${id}`,
      method: "GET",
    });
    return data;
  } catch (error) {
    console.error("Failed to get banner details:", error);
    throw error;
  }
}