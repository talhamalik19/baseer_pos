"use server";

import {
  addProductsToCart,
  deleteEmployee,
  getCategories,
  getCustomers,
  getEmployees,
  getGraphStats,
  getOrders,
  getProducts,
  getSearchProducts,
  handlePasswordForget,
  printInvoice,
  resetPassword,
  updateProduct,
} from "@/lib/Magento";
import {
  addEmployee,
  getConsent,
  getFeedback,
  getOrdersByDate,
  getPOSData,
  getPOSRole,
  getSalesReport,
  savePOSData,
  sendOrderInvoice,
  submitCancelOrder,
  submitConsent,
  submitFeedback,
  submitRefundOrder,
} from "./restAPI";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function fetchProductsAction(categoryId, sort, currency) {
  try {
    const products = await getProducts({
      id: categoryId,
      sort: sort,
      currency: currency,
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function addProductToCartAction(sku, cartId, options) {
  try {
    const products = await addProductsToCart(sku, cartId, options);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getCategoriesAction() {
  try {
    const categories = await getCategories();
    return categories;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function searchProductsAction(search, pos_code) {
  try {
    const products = await getSearchProducts(search, pos_code);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function resetPasswordAction(
  username,
  password,
  newPassword,
  jwt
) {
  try {
    const response = await resetPassword(username, password, newPassword);
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function deleteEmployeeAction(username) {
  try {
    const response = await deleteEmployee(username);
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getOrdersAction(search) {
  try {
    const response = await getOrders(search);
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function submitRefundAction(actionData, entity_id, pos_code) {
  try {
    const response = await submitRefundOrder(actionData, entity_id, pos_code);
    return response;
  } catch (error) {
    console.error("Error submitting refund request:", error);
    return [];
  }
}

export async function submitCancelAction(actionData) {
  try {
    const response = await submitCancelOrder(actionData);
    return response;
  } catch (error) {
    console.error("Error submitting cancel request:", error);
    return [];
  }
}

export async function getGraphStatsAction(duration) {
  try {
    const response = await getGraphStats(duration);
    return response;
  } catch (error) {
    console.error("Error getting graph stats:", error);
    return [];
  }
}

export async function addEmployeeAction(actionData) {
  try {
    const response = await addEmployee(actionData);
    return response;
  } catch (error) {
    console.error("Error submitting cancel request:", error);
    return [];
  }
}

export async function savePOSDataAction(actionData) {
  try {
    const response = await savePOSData(actionData);
    return response;
  } catch (error) {
    console.error("Error submitting cancel request:", error);
    return [];
  }
}

export async function getPOSDataAction(code) {
  try {
    const response = await getPOSData(code);
    return response;
  } catch (error) {
    console.error("Error submitting cancel request:", error);
    return [];
  }
}

export async function getPOSRoleAction(username) {
  try {
    const response = await getPOSRole(username);
    return response;
  } catch (error) {
    console.error("Error submitting cancel request:", error);
    return [];
  }
}

export async function getOrdersByDateAction(from_date, to_date) {
  try {
    const response = await getOrdersByDate(from_date, to_date);
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

export async function getProductsAction(id) {
  try {
    const response = await getProducts({ id: id });
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

export async function getOrderDetailsAction(searchKeyword, pageSize, page) {
  try {
    const response = await getOrders(searchKeyword, pageSize, page);
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

export async function getCustomerAction(searchKeyword, pageSize, page) {
  try {
    const response = await getCustomers(searchKeyword, pageSize, page);
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

export async function getEmployeeAction(searchKeyword, pageSize, page) {
  try {
    const response = await getEmployees(searchKeyword, pageSize, page);
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

export async function getSalesReportAction(apiUrl) {
  try {
    const response = await getSalesReport(apiUrl);
    return response;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

export async function fetchCurrencyData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            currency {
              base_currency_code
              base_currency_symbol
              default_display_currency_code
              default_display_currency_symbol
              available_currency_codes
              exchange_rates {
                currency_to
                rate
                currency_to_symbol
              }
            }
          }
        `,
      }),
    });
    const { data } = await response.json();
    return data.currency;
  } catch (error) {
    console.error("Error fetching currency data:", error);
    return null;
  }
}

export async function fetchLanguageData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
  availableStores(useCurrentGroup: true) {
  id
    store_code
    store_name
    is_default_store
    store_group_code
    is_default_store_group
    locale
    base_currency_code
    default_display_currency_code
    timezone
    weight_unit
    base_url
    base_link_url
    base_static_url
    base_media_url
    secure_base_url
    secure_base_link_url
    secure_base_static_url
    secure_base_media_url
  }
}

        `,
      }),
    });
    const { data } = await response.json();
    return data.availableStores;
  } catch (error) {
    console.error("Error fetching currency data:", error);
    return null;
  }
}
export async function getCurrentCurrency() {
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency_code")?.value || "USD";
  const currencySymbol = cookieStore.get("currency_symbol")?.value || "$";

  return {
    code: currencyCode,
    symbol: currencySymbol,
  };
}

export async function setCurrentCurrency(currencyCode, currencySymbol) {
    const cookieStore = await cookies();
  const cookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set("currency_code", currencyCode, cookieOptions);
  cookieStore.set("currency_symbol", currencySymbol, cookieOptions);
}

export async function setCurrentLanguage(storeCode, code, store) {
  const cookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  cookies().set("store_code", storeCode, cookieOptions);
  cookies().set("store", store, cookieOptions);
  cookies().set("store_id", code, cookieOptions);
}

export async function printInvoiceAction(id) {
  try {
    const response = await printInvoice(id);
    return response;
  } catch (error) {
    console.error("Error Printing Invoice:", error);
    return [];
  }
}

export async function updateProductAction(formData) {
  try {
    const response = await updateProduct(formData);
    return response;
  } catch (error) {
    console.error("Error Updating Product:", error);
    return [];
  }
}

export async function sendOrderInvoiceAction(id) {
  try {
    const response = await sendOrderInvoice(id);
    return response;
  } catch (error) {
    console.error("Error Updating Product:", error);
    return [];
  }
}

export async function handlePasswordForgetAction() {
  try {
    const response = await handlePasswordForget();
    return response;
  } catch (error) {
    console.error("Error Updating Product:", error);
    return [];
  }
}

export async function submitConsentAction(data) {
  try {
    const response = await submitConsent(data);
    return response;
  } catch (error) {
    console.error("Error Updating Product:", error);
    return [];
  }
}

export async function getCustomerConsentAction(email, phone) {
  try {
    const response = await getConsent(email, phone);
    return response;
  } catch (error) {
    console.error("Error Updating Product:", error);
    return [];
  }
}

export async function getFeedbackAction(data) {
  try {
    const response = await getFeedback(data);
    return response;
  } catch (error) {
    console.error("Error Updating Product:", error);
    return [];
  }
}


export async function revalidateProducts() {
  revalidateTag("products");
}

export const recheckConsentFromAPI = async (email, phone) => {
  if (!email && !phone) return null;

  try {
    console.log("Re-checking consent from API for:", { email, phone });
      const formattedPhone = phone ? phone.replace(/\+/g, "%2B") : phone;
const formattedEmail = email ? email.replace(/\+/g, "%2B") : email;
    const res = await getCustomerConsentAction(formattedEmail, formattedPhone);

    if (Array.isArray(res) && res.length > 0 && res[0]?.consent) {
      console.log("Updated consent status:", res[0].consent);
      return res[0].consent;
    }

    if (Array.isArray(res) && res.length > 0 && res[0]?.consent === null) {
      return "not_set";
    }

    if (res && res.consent) {
      console.log("Updated consent status:", res.consent);
      return res.consent;
    }

    if (res && res.message) {
      return "not_found";
    }

    return "no";
  } catch (err) {
    console.error("Consent re-check API error:", err);
    return "no";
  }
};

export async function submitFeedbackAction(data) {
  try {
    const response = await submitFeedback(data);
    return response;
  } catch (error) {
    console.error("Error Submitting Feedback:", error);
    return [];
  }
}