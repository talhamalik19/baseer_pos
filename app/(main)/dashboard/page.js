import Dashboard from "@/components/blocks/Dashboard";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import PageHead from "@/components/global/PageHead";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const response = await getAdminDetail();
  const user = response;
  const { firstname, lastname } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${
    lastname?.charAt(0) || ""
  }`.toUpperCase();
    const serverCurrency = await CurrencyProvider()
    const serverLanguage = await LanguageProvider()

  return (
    <>
      <ProtectedRoute requiredPermission="dashboard_view">
        <PageHead
          pageName={serverLanguage?.csvTranslations?.dashboard ?? "Dashboard"}
          firstName={firstname}
          lastName={lastname}
          initials={initials}
          serverCurrency={serverCurrency}
          serverLanguage={serverLanguage}
        />
        <Dashboard jwt={jwt} serverLanguage={serverLanguage?.csvTranslations} />
      </ProtectedRoute>
    </>
  );
}
