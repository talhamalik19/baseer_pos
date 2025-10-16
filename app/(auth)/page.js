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
        if (token) {
          // Auth token
          cookieStore.set("jwt", token, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24,
          });

          // Warehouse
          if (posDetail?.warehouse?.warehouse_id) {
            cookieStore.set("warehouse_id", posDetail.warehouse.warehouse_id.toString(), {
              httpOnly: true,
              path: "/",
              maxAge: 60 * 60 * 24,
            });
          }

          // Currency (if not set)
          if (!cookieStore.get("currency_code")) {
            cookieStore.set("currency_code", "USD", {
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
            });
            cookieStore.set("currency_symbol", "$", {
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
            });
          }

          // Store/Language settings
          const existingStore = cookieStore.get("store");
          const existingStoreCode = cookieStore.get("store_code");

          if (!existingStore || !existingStoreCode) {
            const stores = await getAvailableStores(token);
            const defaultStore =
              stores.find((store) => store.is_default_store) || stores[0];
          
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
          
        }

        try {
          const role = await getPOSRoleAction(email);
          if (role[0] === "success") {
            return { success: true, role: role[1]?.role, posDetail };
          }
        } catch {
          return { success: false, message: "Role fetching failed" };
        }
      }

      if (res?.data?.status === 401) {
        return {
          success: false,
          error: res?.data.message,
          status: 401,
        };
      }
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
