import EmployeeDetail from "@/components/blocks/Employees";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";
import PageHead from "@/components/global/PageHead";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { getAdminDetail, getEmployees } from "@/lib/Magento";
import { getWarehouseCodes } from "@/lib/Magento/restAPI";
import { cookies } from "next/headers";

export default async function Employees() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;
  const warehouseId = cookieStore.get("warehouse_id")?.value || null

  const response = await getAdminDetail();
  const user = response;
  const { firstname, lastname, username } = user?.data?.data;
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
  const res = await getEmployees(warehouseId);
  const total_count = 9;

  const warehouseCodes = await getWarehouseCodes(username)
    const serverCurrency = await CurrencyProvider()
      const serverLanguage = await LanguageProvider()
  
  
  
  return (
    <>
    <ProtectedRoute requiredPermission="employees_view">
      <PageHead pageName={'Employees'} firstName={firstname} lastName={lastname} initials={initials} serverCurrency={serverCurrency} serverLanguage={serverLanguage}/>
      {/* <Dashboard jwt={jwt}/> */}
      <EmployeeDetail jwt={jwt} employee={res} user={user} warehouseCodes={warehouseCodes} serverLanguage={serverLanguage?.csvTranslations} total_count={total_count} warehouseId={warehouseId}/>
      </ProtectedRoute>
    </>
  );
}