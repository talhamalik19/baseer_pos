import { cookies } from "next/headers";
import LoginForm from "@/components/blocks/Login/LoginForm";
import { loginAdminMagento } from "@/lib/Magento/restAPI";
import { getPOSRoleAction } from "@/lib/Magento/actions";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";

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

        // Currency setup using CurrencyProvider
        if (!cookieStore.get("currency_code")?.value) {
          const currencyData = await CurrencyProvider();
          
          cookieStore.set("currency_code", currencyData.code, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
          cookieStore.set("currency_symbol", currencyData.symbol, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }

        // Store / Language setup using LanguageProvider
        if (!cookieStore.get("store")?.value || !cookieStore.get("store_code")?.value) {
          const languageData = await LanguageProvider();
          
          if (languageData.selectedStore) {
            cookieStore.set("store", languageData.storeName, {
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
            });
            cookieStore.set("store_code", languageData.storeCode, {
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
            });
            cookieStore.set("store_id", languageData.storeId.toString(), {
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