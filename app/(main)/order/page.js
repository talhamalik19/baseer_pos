import React from "react";
import { cookies } from "next/headers";
import { getAdminDetail, getCustomers, getOrders } from "@/lib/Magento";
import OrderListing from "@/components/blocks/Orders/OrderListing";
import PageHead from "@/components/global/PageHead";
import SyncHandler from "@/components/SyncHandler";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister/ServiceWorkerRegister";
import CurrencyProvider from "@/components/global/CurrencyProvider";
import LanguageProvider from "@/components/global/LanguageProvider";

export default async function Order({ searchParams }) {
  const params = await searchParams;
  let ordersResponse;
  let customerResponse;

  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value || null;

  const userResponse = await getAdminDetail();
  const user = userResponse;
  const { firstname, lastname } = user?.data?.data || {};
  const initials = `${firstname?.charAt(0) || ""}${
    lastname?.charAt(0) || ""
  }`.toUpperCase();
  const serverCurrency = await CurrencyProvider();
  const serverLanguage = await LanguageProvider();

  const now = new Date();
  const toISOString = now.toISOString(); // current time
  const from = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 24 hours ago
  const fromISOString = from.toISOString();
  if (params?.customer_email) {
    customerResponse  = await getOrders({
      email: params?.customer_email,
      phone: "",
      orderNumber: "",
      billName: "",
      status: "",
      isPosOrder: null,
      isMobOrder: null,
      isWebOrder: null,
      posCode: "",
      dateFrom: "",
      dateTo: "",
    });
  } else {
    ordersResponse = await getOrders({
      email: "",
      phone: "",
      orderNumber: "",
      billName: "",
      status: "",
      isPosOrder: null,
      isMobOrder: null,
      isWebOrder: null,
      posCode: "",
      dateFrom: fromISOString,
      dateTo: toISOString,
    });
  }
  return (
    <>
      <PageHead
        pageName={"Orders"}
        firstName={firstname}
        lastName={lastname}
        initials={initials}
        serverCurrency={serverCurrency}
        serverLanguage={serverLanguage}
      />
      <OrderListing
        initialOrders={ordersResponse}
        customerOrders={customerResponse}
        jwt={jwt}
        serverLanguage={serverLanguage?.csvTranslations}
        params={params?.customer_email}
      />
      <SyncHandler />
      <ServiceWorkerRegister />
    </>
  );
}
