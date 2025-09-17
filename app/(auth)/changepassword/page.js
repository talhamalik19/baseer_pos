import React from "react";
import style from "@/app/(main)/form.module.scss";
import ForgetPass from "@/components/blocks/ForgetPassword";
import LanguageProvider from "@/components/global/LanguageProvider";
import { handlePasswordChange, handlePasswordForget } from "@/lib/Magento";
import ChangePasswordBlock from "@/components/blocks/ChangePassword";

export default async function ChangePassword() {
  const handleSubmit = async (formData) => {
    "use server";
    const email = formData.get("email");
    const password = formData.get("newPassword");
    const otp = formData.get("otp")
    const response = await handlePasswordChange(email, password, otp);
      return {
      status: response.status,
      success: response?.data?.success ?? false,
      message: response?.data?.message ?? "Something went wrong.",
    };
  };
  const serverLanguage = await LanguageProvider();
  return (
    <>
      <ChangePasswordBlock
        handleSubmit={handleSubmit}
        serverLanguage={serverLanguage?.csvTranslations}
        style={style}
      />
    </>
  );
}
