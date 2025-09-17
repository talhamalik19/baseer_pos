import Account from "@/components/blocks/Setting/Account";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import PageHead from "@/components/global/PageHead";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { getAdminDetail } from "@/lib/Magento";
import { cookies } from "next/headers";

export default async function Setting() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  
  const response = await getAdminDetail();
  const user = response;
  const { firstname, lastname, username, email } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
    const serverCurrency = await CurrencyProvider()
        const serverLanguage = await LanguageProvider()
    
  
  
  return (
    <>
      <ProtectedRoute requiredPermission="employees_password_update">
      <PageHead pageName={'Setting'} firstName={firstname} lastName={lastname} initials={initials} serverCurrency={serverCurrency} serverLanguage={serverLanguage}/>
      <Account username={username} firstname={firstname} lastname={lastname} email={email} jwt={jwt} serverLanguage={serverLanguage?.csvTranslations}/>
      </ProtectedRoute>
    </>
  );
}
