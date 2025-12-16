"use server";
import addToCart from "@/utills/addToCart";
import categoryQuery from "@/utills/categoryQuery";
import customerQuery from "@/utills/customerQuery";
import deleteEmployeeMutation from "@/utills/deleteEmployeeMutation";
import downloadInvoice from "@/utills/downloadInvoicQuery";
import adminDetail from "@/utills/getAdminDetail";
import getCartQuery from "@/utills/getCartItems";
import employeesQuery from "@/utills/getEmployees";
import getOrdersByKeyQuery from "@/utills/getOrdersByKeyQuery";
import getOrdersQuery from "@/utills/getOrdersQuery";
import getRecentOrderQuery from "@/utills/getRecentOrderQuery";
import salesStats from "@/utills/getSalesStats";
import graphQuery from "@/utills/graphQiery";
import handlePasswordChangeQuery from "@/utills/handlePasswordChangeQuery";
import handlePasswordForgetQuery from "@/utills/handlePasswordForgetQuery";
import productQuery from "@/utills/productQuery";
import resetPasswordMutation from "@/utills/resetPasswordMutation";
import salesByCountriesQuery from "@/utills/salesByCountriesQuery";
import searchQuery from "@/utills/searchQuery";
import updateProductQuery from "@/utills/updateProductQuery";
import { cookies } from "next/headers";

export async function magentoGraphQLFetch({
  query,
  variables = {},
  headers,
  cache = "force-cache", // default static cache
  tags,
  revalidate, // 🔥 NEW: optional revalidate param
  fetchOptions = {},
  pos_code
}) {
  try {
    const cookieStore = await cookies();
    const storeCode = cookieStore.get("store_code")?.value || "default";

    const endpoint = process.env.NEXT_PUBLIC_API_URL;

    const fetchConfig = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Store": storeCode,
        ...headers,
      },
      cache,
      body: JSON.stringify({ query, variables }),
      ...fetchOptions,
    };

    if (tags || revalidate !== undefined) {
      fetchConfig.next = {};
      if (tags) fetchConfig.next.tags = tags;
      if (revalidate !== undefined) fetchConfig.next.revalidate = revalidate;
    }

    const result = await fetch(`${endpoint}/graphql?pos_code=${pos_code}`, fetchConfig);

    const body = await result.json();
    if (body.errors) {
      return {
        status: result.status,
        message: body.errors[0].message,
        errors: body.errors,
      };
    }
    return {
      status: result.status,
      body,
    };
  } catch (e) {
    if (typeof isMagentoError === "function" && isMagentoError(e)) {
      throw {
        cause: e.cause ? e.cause.toString() : "unknown",
        status: e.status || 500,
        message: e.message,
        query,
      };
    }

    throw {
      error: e,
      query,
    };
  }
}
export async function loginMagento({ email, password }) {
  const query = `
      mutation generateCustomerToken($email: String!, $password: String!) {
        generateCustomerToken(email: $email, password: $password) {
          token
        }
      }
    `;

  const variables = { email, password };
  try {
    const response = await magentoGraphQLFetch({ query, variables });
    if (response?.body?.data?.generateCustomerToken?.token) {
      return {
        status: response.status,
        token: response.body.data.generateCustomerToken.token,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Magento Login Error:", error);
    throw error;
  }
}

export async function getProducts({ id = ``, sort = ``, currency, pos_code }) {
  const query = productQuery(id, sort);
  const variables = {};
  const cache = "no-store";

  const tags = ["products"]; 

  const revalidate = 1800; 

  const cookieStore = await cookies();
  const storeCode = cookieStore.get("store_code")?.value || "default";
  const headers = {
    "Content-Currency": currency || "USD",
    "Store": storeCode
  };

  try {
    const response = await magentoGraphQLFetch({
      query,
      variables,
      cache,
      revalidate,
      tags,      
      headers,
      pos_code
    });
    if (response?.body?.data?.products) {
      return response?.body?.data?.products;
    }
    return [];
  } catch (error) {
    console.error("Direct Fetch Error:", error);
    throw error;
  }
}


export async function getCategories() {
  const query = categoryQuery();
  const variables = {};
  const cache = "force-cache"; // 🔥 change from no-store to force-cache
  const revalidate = 60; // 🔥 revalidate every 60 seconds

  try {
    const response = await magentoGraphQLFetch({
      query,
      variables,
      cache,
      revalidate,
    });
    if (response?.body?.data?.categoryList) {
      return {
        status: response.status,
        data: response?.body?.data?.categoryList,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Magento Login Error:", error);
    throw error;
  }
}

export async function getSearchProducts(search, pos_code) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql?pos_code=${pos_code}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{
          products(search: ${search}) {
          items {
          id
        uid
        name
        sku
          tax_percent
      is_pos_discount_allowed
      pos_discount_percent
      apply_discount_on
      custom_price
      pos_stock
          categories{
            name
        }
        __typename
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
          }
        }
        price {
          regularPrice {
            amount {
              value
              currency
            }
          }
        }
        image {
          url
          label
        }
        small_image {
          url
          label
        }
        thumbnail {
          url
          label
        }
        special_price
       ... on ConfigurableProduct {
  configurable_options {
    attribute_id
    attribute_code
    label
    values {
      uid
      value_index
      label
    }
  }
  variants {
    product {
      sku
    }
    attributes {
      code
      value_index
    }
  }
}

       ... on CustomizableProductInterface {
        options {
          title
          required
          sort_order
          option_id
          ... on CustomizableRadioOption {
            radio_option: value {
              option_type_id
              sku
              price
              price_type
              title
              sort_order
            }
          }
          ... on CustomizableCheckboxOption {
            checkbox_option: value {
              option_type_id
              sku
              price
              price_type
              title
              sort_order
            }
          }
        }
      }
        ... on DownloadableProduct {
          links_title
          links_purchased_separately
          downloadable_product_links {
            sample_url
            sort_order
            title
            uid
            price
          }
          downloadable_product_samples {
            title
            sort_order
            sample_url
          }
        }
      }
          }
        }`,
        }),
      }
    );

    const data = await response.json();
    if (data?.data?.products?.items) {
      return data?.data?.products?.items;
    }
    return [];
  } catch (error) {
    console.error("Magento Login Error:", error);
    throw error;
  }
}

export async function getAdminDetail() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = adminDetail;
  const variables = {};
  try {
    const response = await magentoGraphQLFetch({
      query,
      variables,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    if (response?.body?.data?.getAdminDetail) {
      return {
        status: response.status,
        data: response?.body?.data?.getAdminDetail,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Magento Login Error:", error);
    throw error;
  }
}

export async function getSalesStats(duration) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const currencyCode = cookieStore.get("currency_code").value || "USD";
  const query = salesStats(duration);

  const variables = {};
  const headers = {
    Authorization: `Bearer ${jwt}`,
   "content-currency" : currencyCode
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.salesReport?.data) {
      return {
        status: response.status,
        data: response?.body?.data?.salesReport?.data,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Magento Login Error:", error);
    throw error;
  }
}

export async function recentOrders() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = getOrdersQuery({email: "", phone: "", orderNumber: "", billName: "", status: "", isPosOrder: null, isWebOrder: null, isMobOrder: null, posCode: "", dateFrom: "", dateTo: ""}, 5, 1);
  const variables = {};
  const headers = {
    Authorization: `Bearer ${jwt}`,
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.getOrders) {
      return {
        status: response.status,
        data: response?.body?.data?.getOrders?.data,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Magento Login Error:", error);
    throw error;
  }
}

export async function getOrders(searchKeyword, pageSize = 100, page = 1) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = getOrdersQuery(
    searchKeyword ? searchKeyword : "",
    pageSize,
    page
  );
  const headers = {
    Authorization: `Bearer ${jwt}`,
  };
  try {
    // Pass the cache option directly to ensure it's not using the default
    const response = await magentoGraphQLFetch({
      query,
      variables: {},
      headers,
      cache: "no-cache",
    });
    if (response?.body?.data?.getOrders) {
      return {
        status: response.status,
        data: response?.body?.data?.getOrders?.data,
        total_count: response?.body?.data?.getOrders?.total_count,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Order fetched failed Error:", error);
    throw error;
  }
}

export async function addProductsToCart(sku, cartId, options) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = addToCart(sku, cartId, options);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query: addToCart(sku, cartId, options),
      }),
    });
    const body = await response.json();
    if (body?.data?.addProductsToCart?.cart) {
      return {
        status: 200,
        data: body?.data?.addProductsToCart?.cart,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {}
}

export async function resetPassword(username, password, newPassword) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = resetPasswordMutation(username, password, newPassword);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    const body = await response.json();
    if (body?.data?.updatePassword) {
      return {
        data: body?.data?.updatePassword?.message,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {}
}

export async function getEmployees(code) {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query: employeesQuery(code),
      }),
    });
    const body = await response.json();
    if (body?.data?.getStoreEmployees?.data) {
      return {
        data: body?.data?.getStoreEmployees?.data,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {}
}

export async function getCart(cartId) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = getCartQuery(cartId);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    const body = await response.json();

    if (body?.data?.addProductsToCart?.cart) {
      return {
        status: 200,
        data: body?.data?.addProductsToCart?.cart,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {}
}

export async function deleteEmployee(username) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = deleteEmployeeMutation(username);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    const body = await response.json();
    if (body?.data?.deleteAdminUser) {
      return {
        data: body?.data?.deleteAdminUser?.message,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {}
}

export async function getCustomers(search, pageSize = 10, page = 1) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = customerQuery(search, pageSize, page);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query: query,
      }),
    });
    const body = await response.json();
    if (body?.data?.getCustomers) {
      return {
        data: body?.data?.getCustomers?.data,
        total_count: body?.data?.getCustomers?.total_customers
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {}
}

export async function getGraphStats(duration) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = graphQuery(duration);
  const variables = {};
  const headers = {
    Authorization: `Bearer ${jwt}`,
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.getOrdersGraph?.data) {
      return {
        status: response.status,
        data: response?.body?.data?.getOrdersGraph?.data,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Error Getting Charts Data:", error);
    throw error;
  }
}

export async function getSales() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = salesByCountriesQuery;
  const variables = {};
  const headers = {
    Authorization: `Bearer ${jwt}`,
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.salesPercentageByCountries?.data) {
      return {
        status: response.status,
        data: response?.body?.data?.salesPercentageByCountries?.data,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Error Getting Charts Data:", error);
    throw error;
  }
}

export async function printInvoice(id) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const query = downloadInvoice(id);
  const variables = {};
  const headers = {
    Authorization: `Bearer ${jwt}`,
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.downloadInvoicePdf) {
      return {
        status: response.status,
        data: response?.body?.data?.downloadInvoicePdf,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Error Getting Charts Data:", error);
    throw error;
  }
}

export async function updateProduct(formData) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  const store = cookieStore.get("store_code")?.value || "default";
  const query = updateProductQuery(formData);
  const variables = {};
  const headers = {
    Authorization: `Bearer ${jwt}`,
    "Store": store
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.updateProductDetails) {
      return {
        status: response.status,
        data: response?.body?.data?.updateProductDetails,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Error Getting Charts Data:", error);
    throw error;
  }
}

export async function handlePasswordForget(email) {
  const query = handlePasswordForgetQuery(email);
  const variables = {};
  const headers = {};
  const cache = "no-store";
  try {
    const response = await magentoGraphQLFetch({
      query,
      variables,
      headers,
      cache,
    });
    if (response?.body?.data?.initiatePasswordReset) {
      return {
        status: response.status,
        data: response?.body?.data?.initiatePasswordReset,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Error Getting Charts Data:", error);
    throw error;
  }
}

export async function handlePasswordChange(email, password, otp) {
  const query = handlePasswordChangeQuery(email, password, otp);
  const variables = {};
  const headers = {
    "Content-TYpe": "application/json",
  };
  try {
    const response = await magentoGraphQLFetch({ query, variables, headers });
    if (response?.body?.data?.resetPasswordWithOtp) {
      return {
        status: response.status,
        data: response?.body?.data?.resetPasswordWithOtp,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Error Getting Charts Data:", error);
    throw error;
  }
}

export async function getAvailableStores(token) {
  const query = `
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
        secure_base_url
      }
    }
  `;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    const result = await response.json();
    return result?.data?.availableStores || [];
  } catch (error) {
    console.error("Error fetching available stores:", error);
    return [];
  }
}


export async function getOrdersByKey(key, pageSize = 100, page = 1) {
  const query = getOrdersByKeyQuery(
    key ? key : "",
    pageSize,
    page
  );
  try {
    // Pass the cache option directly to ensure it's not using the default
    const response = await magentoGraphQLFetch({
      query,
      variables: {},
      cache: "no-cache",
    });
    if (response?.body?.data?.getOrdersByKey) {
      return {
        status: response.status,
        data: response?.body?.data?.getOrdersByKey?.data?.[0],
        total_count: response?.body?.data?.getOrdersByKey?.total_count,
      };
    } else {
      return {
        errors: response?.errors,
      };
    }
  } catch (error) {
    console.error("Order fetched failed Error:", error);
    throw error;
  }
}