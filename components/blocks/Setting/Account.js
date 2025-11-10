"use client";
import React, { useState } from "react";
import style from "./setting.module.scss";
import { resetPasswordAction } from "@/lib/Magento/actions";

export default function Account({ username, email, firstname, lastname, jwt, serverLanguage }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState("");

  const validateForm = () => {
    let newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }
    if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse(""); // Clear previous response message

    if (validateForm()) {
      const res = await resetPasswordAction(
        username,
        formData?.currentPassword,
        formData?.newPassword,
        jwt
      );
      setResponse(res?.data || "Password changed successfully!");
    }
  };

  return (
    <div className={`${style.block} page_detail`}>
      <div className={style.account_block}>
      <div className={style.account_detail}>
        <p>{serverLanguage?.name ?? 'Name'}</p>
        <p>{`${firstname} ${lastname}`}</p>
      </div>
      <div className={style.account_detail}>
        <p>{serverLanguage?.email ?? 'Email'}</p>
        <p>{email}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={style.account_detail}>
          <p>{serverLanguage?.current_password ?? 'Current Password'}</p>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className={style.account_detail}>
          <p>{serverLanguage?.new_password ?? 'New Password'}</p>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            required
            onChange={handleChange}
          />
          {errors.newPassword && (
            <span className={style.error}>{errors.newPassword}</span>
          )}
        </div>
        <div className={style.account_detail}>
          <p>{serverLanguage?.confirm_new_password ?? 'Confirm New Password'}</p>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        
        </div>
        <button type="submit">{serverLanguage?.change_password ?? 'Change Password'}</button>
        {response && <p className={`${response == "Password updated successfully." || response == "Password changed successfully." ? style.success_response : style.error_response}`}>{response}</p>}
          {errors.confirmPassword && (
            <span className={style.error}>{errors.confirmPassword}</span>
          )}
          {errors.currentPassword && (
            <span className={style.error}>{errors.currentPassword}</span>
          )}
      </form>
    </div>
    </div>
  );
}
