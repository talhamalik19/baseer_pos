import React from "react";
import style from "@/app/(main)/form.module.scss";
import ForgetPass from "@/components/blocks/ForgetPassword";
import LanguageProvider from "@/components/global/LanguageProvider";
import { handlePasswordForget } from "@/lib/Magento";

export default async function ForgetPassword() {
  const handleSubmit = async (formData) => {
    "use server";
    const email = formData.get("email");
    const response = await handlePasswordForget(email);

    return {
      status: response.status,
      success: response?.data?.success ?? false,
      message: response?.data?.message ?? "Something went wrong.",
    };
  };

  const serverLanguage = await LanguageProvider();

  return (
    <>
      <ForgetPass
        handleSubmit={handleSubmit}
        serverLanguage={serverLanguage?.csvTranslations}
        style={style}
      />
    </>
  );
}

