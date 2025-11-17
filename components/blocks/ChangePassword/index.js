"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function ChangePassword({
  handleSubmit,
  serverLanguage,
  style,
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const [theme, setTheme] = useState("light")
  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!otp) {
      newErrors.otp = serverLanguage?.otp_required ?? "OTP is required";
    }

    if (!newPassword) {
      newErrors.newPassword =
        serverLanguage?.password_required ?? "New password is required";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        serverLanguage?.confirm_password_required ??
        "Please confirm your password";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword =
        serverLanguage?.passwords_not_match ?? "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("otp", otp);
    formData.append("newPassword", newPassword);

    try {
      const data = await handleSubmit(formData);
      if (data?.success) {
        setMessage(data.message);
        localStorage.removeItem("email");
        // Optionally redirect after success
        router.push("/");
      } else {
        setMessage(data?.message ?? "Something went wrong. Please try again.");
      }
    } catch (error) {
      setMessage(
        serverLanguage?.something_went_wrong ?? "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

      useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      }, []);

  return (
    <div className={style.form}>
      <div className={style.form_block}>
        <h2 className={style.title}>
          {serverLanguage?.change_password ?? "Change Password"}
        </h2>
        <p className={style.subtitle}>
          {serverLanguage?.enter_otp_and_new_password_below ??
            "Please enter the OTP and your new password below"}
        </p>

        <form
          onSubmit={handleFormSubmit}
          className={style.login_form}
          autoComplete="off"
        >
          {/* OTP Field */}
          <div className={style.input_box}>
            <label htmlFor="otp" className={style.label}>
              {serverLanguage?.otp ?? "OTP"}
            </label>
            <input
              type="text"
              className={style.input_field}
              id="otp"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="off"
              maxLength="6"
            />
            {errors.otp && <p className={style.error_message}>{errors.otp}</p>}
          </div>

          {/* New Password Field */}
          <div className={style.input_box}>
            <label htmlFor="new-password" className={style.label}>
              {serverLanguage?.new_password ?? "New Password"}
            </label>
            <input
              type="password"
              className={style.input_field}
              id="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.newPassword && (
              <p className={style.error_message}>{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className={style.input_box}>
            <label htmlFor="confirm-password" className={style.label}>
              {serverLanguage?.confirm_password ?? "Confirm Password"}
            </label>
            <input
              type="password"
              className={style.input_field}
              id="confirm-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className={style.error_message}>{errors.confirmPassword}</p>
            )}
          </div>

          {message && <p className={style.error_message}>{message}</p>}
          <div className={style.forgotPassword}>
            <Link href="/">
              {serverLanguage?.back_to_login ?? "Back to Login"}
            </Link>
          </div>
          <div className={style.submit_btn}>
            <button
              type="submit"
              className={style.btn_submit}
              disabled={loading}
            >
              {loading
                ? serverLanguage?.submitting ?? "Submitting.."
                : serverLanguage?.submit ?? "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
