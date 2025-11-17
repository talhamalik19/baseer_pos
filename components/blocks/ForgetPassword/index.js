"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function ForgetPass({ handleSubmit, serverLanguage, style }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [theme, setTheme] = useState("light")

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("email", email);

    const data = await handleSubmit(formData);

    if (data?.success) {
      setMessage(data.message);
      setSuccess(true);
      localStorage.setItem("email", email);
    } else {
      setMessage(data?.message ?? "Something went wrong. Please try again.");
    }

    setLoading(false);
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
          {serverLanguage?.forgot_your_password ?? "Forgot Your Password?"}
        </h2>
        <p className={style.subtitle}>
          {serverLanguage?.please_enter_your_email_address_below_you_will_receive_a_link_to_reset_your_password ??
            "Please enter your email address below. You will receive a link to reset your password"}
        </p>

        <form
          onSubmit={handleFormSubmit}
          className={style.login_form}
          autoComplete="off"
        >
          <div className={`${style.input_box} ${email ? "has-value" : ""}`}>
            <label htmlFor="log-email" className={style.label}>
              {serverLanguage?.email ?? "Email"}
            </label>
            <input
              type="email"
              className={style.input_field}
              id="log-email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              placeholder="Enter Your Email"
            />
            <svg
              width="17"
              height="20"
              viewBox="0 0 17 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.1305 5.40036C14.1305 8.38289 11.6998 10.8007 8.70135 10.8007C5.70292 10.8007 3.27222 8.38289 3.27222 5.40036C3.27222 2.41782 5.70292 0 8.70135 0C11.6998 0 14.1305 2.41782 14.1305 5.40036ZM13.3613 13.8434C15.0875 14.1815 16.2145 14.7331 16.6974 15.6228C17.0602 16.3171 17.0602 17.1437 16.6974 17.8381C16.2145 18.7278 15.1322 19.3149 13.3434 19.6174C12.5463 19.7729 11.7394 19.874 10.9284 19.9199C10.1771 20 9.42582 20 8.66557 20H7.29711C7.01089 19.9644 6.73362 19.9466 6.4653 19.9466C5.6543 19.9063 4.84726 19.8082 4.05037 19.653C2.32414 19.3327 1.19717 18.7633 0.714185 17.8737C0.527735 17.529 0.429438 17.144 0.427971 16.7527C0.424084 16.3589 0.519408 15.9705 0.705241 15.6228C1.17928 14.7331 2.30625 14.1548 4.05037 13.8434C4.85077 13.6915 5.66057 13.5934 6.47424 13.5498C7.96266 13.4338 9.45792 13.4338 10.9463 13.5498C11.7569 13.5955 12.5635 13.6936 13.3613 13.8434Z"
                fill="#98A2B3"
              />
            </svg>
          </div>

          {message && (
            <p className={`${success ? "success" : "error"}`}>{message}</p>
          )}

          {success && (
            <p className={style.change_link}>
              <Link href="/changepassword">
                {serverLanguage?.click_here_to_change_password ??
                  "Click here to change your password"}
              </Link>
            </p>
          )}
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
                ? serverLanguage?.submitting ?? "Submitting..."
                : serverLanguage?.submit ?? "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
