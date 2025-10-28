import { cookies } from "next/headers";
import LoginForm from "@/components/blocks/Login/LoginForm";
import { loginAdminMagento, getDefaultStoreConfig } from "@/lib/Magento/restAPI";
import { getPOSRoleAction } from "@/lib/Magento/actions";
import LanguageProvider from "@/components/global/LanguageProvider";
import { getAvailableStores } from "@/lib/Magento";

export default async function Login() {
async function handleSubmit(formData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");
  const cookieStore = await cookies();

  try {
    const res = await loginAdminMagento({ email, password });

    if (res?.data) {
      const [token, posDetail] = res.data;
      if (!token) throw new Error("No auth token returned");

      // Set JWT
      cookieStore.set("jwt", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      // Set Warehouse ID
      if (posDetail?.warehouse?.warehouse_id) {
        cookieStore.set("warehouse_id", posDetail.warehouse.warehouse_id.toString(), {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24,
        });
      }

      // Fetch stores only once if needed
      const stores = !cookieStore.get("currency_code") || !cookieStore.get("store") ? await getAvailableStores(token) : [];

      // Currency
      if (!cookieStore.get("currency_code")?.value) {
        const defaultCurrency = stores.find((s) => s.base_currency_code)?.base_currency_code || "USD";
        cookieStore.set("currency_code", defaultCurrency, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
        cookieStore.set("currency_symbol", "$", {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      // Store / Language
      if (!cookieStore.get("store")?.value || !cookieStore.get("store_code")?.value) {
        const defaultStore = stores.find((s) => s.is_default_store) || stores[0];
        if (defaultStore) {
          cookieStore.set("store", defaultStore.store_name, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
          cookieStore.set("store_code", defaultStore.store_code, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
          cookieStore.set("store_id", defaultStore.id.toString(), {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      }

      // Role
      try {
        const role = await getPOSRoleAction(email);
        if (role[0] === "success") {
          return { success: true, role: role[1]?.role, posDetail };
        } else {
          return { success: false, message: "Role fetching failed" };
        }
      } catch (e) {
        console.error("Role fetching error:", e);
        return { success: false, message: "Role fetching failed" };
      }
    }

    if (res?.data?.status === 401) {
      return { success: false, error: res?.data.message, status: 401 };
    }

    return { success: false, message: "Login failed" };
  } catch (error) {
    console.error("Login Failed:", error);
    return {
      success: false,
      message: "Your user/password was incorrect, please try again or contact Administration.",
    };
  }
}


  const serverLanguage = await LanguageProvider();
  return <LoginForm handleSubmit={handleSubmit} serverLanguage={serverLanguage?.csvTranslations} />;
}
