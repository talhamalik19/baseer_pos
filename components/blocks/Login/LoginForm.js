"use client";
import React, { useState } from "react";
import style from "../../../app/(main)/form.module.scss";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteAllOrders } from "@/lib/indexedDB";
import { encryptData } from "@/lib/crypto";

export default function LoginForm({ handleSubmit, serverLanguage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await handleSubmit(formData);
    if (result?.error) {
      setMessage(result?.error);
      setLoading(false);
    } else {
      if (result?.role) {
        localStorage.setItem("role", result.role);
      }
      if (result?.posDetail) {
        const { smtp_config, ...rest } = result.posDetail;

        const encryptedSMTP = encryptData(smtp_config);

        // Save the encrypted SMTP config
        const safeData = {
          ...rest,
          smtp_config: encryptedSMTP,
        };

        localStorage.setItem("loginDetail", JSON.stringify(safeData));
      }

      await deleteAllOrders();
      setMessage(result?.message);
      setLoading(false);

      const pos_detail = localStorage.getItem("posDetail");
      const posCode = localStorage.getItem("pos_code");

      if (!posCode) {
        redirect("/manage-pos");
      } else {
        redirect("/dashboard");
      }
    }
  };

  return (
    <>
      <div className={style.form}>
        <div className={style.form_block}>
          <h2 className={style.title}>{serverLanguage?.login ?? "Login"}</h2>
          <p className={style.subtitle}>
            {serverLanguage?.please_fill_your_information_below ??
              "Please fill your information below"}
          </p>

          <form
            className={style.login_form}
            autoComplete="off"
            onSubmit={handleFormSubmit}
          >
            <div className={style.input_box}>
              <label htmlFor="log-email" className={style.label}>
                {serverLanguage?.username ?? "Username"}
              </label>
              <input
                type="text"
                className={style.input_field}
                id="log-email"
                required
                value={email}
                autoComplete="new-email"
                onChange={(e) => setEmail(e.target.value)}
                name="emailInput"
                placeholder="Enter Your Username"
              />
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.8334 17.5V15.8333C15.8334 14.9493 15.4822 14.1014 14.8571 13.4763C14.232 12.8512 13.3841 12.5 12.5001 12.5H7.50008C6.61603 12.5 5.76818 12.8512 5.14306 13.4763C4.51794 14.1014 4.16675 14.9493 4.16675 15.8333V17.5"
                  stroke="#00BBA7"
                  stroke-width="1.66667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M10.0001 9.16667C11.841 9.16667 13.3334 7.67428 13.3334 5.83333C13.3334 3.99238 11.841 2.5 10.0001 2.5C8.15913 2.5 6.66675 3.99238 6.66675 5.83333C6.66675 7.67428 8.15913 9.16667 10.0001 9.16667Z"
                  stroke="#00BBA7"
                  stroke-width="1.66667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div className={style.input_box}>
              <label htmlFor="log-pass" className={style.label}>
                {serverLanguage?.password ?? "Password"}
              </label>
              <input
                type="password"
                className={style.input_field}
                id="log-pass"
                required
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                name="passwordInput"
                placeholder="Enter Your Password"
              />
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.8333 9.16669H4.16667C3.24619 9.16669 2.5 9.91288 2.5 10.8334V16.6667C2.5 17.5872 3.24619 18.3334 4.16667 18.3334H15.8333C16.7538 18.3334 17.5 17.5872 17.5 16.6667V10.8334C17.5 9.91288 16.7538 9.16669 15.8333 9.16669Z"
                  stroke="#00BBA7"
                  stroke-width="1.66667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5.83325 9.16669V5.83335C5.83325 4.72828 6.27224 3.66848 7.05364 2.88708C7.83504 2.10567 8.89485 1.66669 9.99992 1.66669C11.105 1.66669 12.1648 2.10567 12.9462 2.88708C13.7276 3.66848 14.1666 4.72828 14.1666 5.83335V9.16669"
                  stroke="#00BBA7"
                  stroke-width="1.66667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            {message && <p className="error_message">{message}</p>}
              <div className={style.forgotPassword}>
            <Link href={"/forgetpassword"}>
              {serverLanguage?.forget_password ?? "Forgot Password?"}
            </Link>
          </div>
            <div className={style.submit_btn}>
              <button
                type="submit"
                className={style.btn_submit}
                disabled={loading}
              >
                {loading
                  ? serverLanguage?.loading ?? "Loading..."
                  : serverLanguage?.sign_in ?? "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
