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
      if(result?.posDetail){
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
      const posCode = localStorage.getItem("pos_code")

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
      <h2 className={style.title}>{serverLanguage?.login ?? 'Login'}</h2>
      <p className={style.subtitle}>
        {serverLanguage?.please_fill_your_information_below ?? 'Please fill your information below'}
      </p>

      <form 
        className={style.login_form} 
        autoComplete="off" 
        onSubmit={handleFormSubmit}
      >
        {/* Hidden inputs to confuse autocomplete */}
        <input type="text" name="prevent_autofill" style={{display: 'none'}} />
        <input type="password" name="password_fake" style={{display: 'none'}} />
        
        <div className={style.input_box}>
          <input
            type="text"
            className={style.input_field}
            id="log-email"
            required
            value={email}
            autoComplete="new-email"
            onChange={(e) => setEmail(e.target.value)}
            name="emailInput"
          />
          <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M14.1305 5.40036C14.1305 8.38289 11.6998 10.8007 8.70135 10.8007C5.70292 10.8007 3.27222 8.38289 3.27222 5.40036C3.27222 2.41782 5.70292 0 8.70135 0C11.6998 0 14.1305 2.41782 14.1305 5.40036ZM13.3613 13.8434C15.0875 14.1815 16.2145 14.7331 16.6974 15.6228C17.0602 16.3171 17.0602 17.1437 16.6974 17.8381C16.2145 18.7278 15.1322 19.3149 13.3434 19.6174C12.5463 19.7729 11.7394 19.874 10.9284 19.9199C10.1771 20 9.42582 20 8.66557 20H7.29711C7.01089 19.9644 6.73362 19.9466 6.4653 19.9466C5.6543 19.9063 4.84726 19.8082 4.05037 19.653C2.32414 19.3327 1.19717 18.7633 0.714185 17.8737C0.527735 17.529 0.429438 17.144 0.427971 16.7527C0.424084 16.3589 0.519408 15.9705 0.705241 15.6228C1.17928 14.7331 2.30625 14.1548 4.05037 13.8434C4.85077 13.6915 5.66057 13.5934 6.47424 13.5498C7.96266 13.4338 9.45792 13.4338 10.9463 13.5498C11.7569 13.5955 12.5635 13.6936 13.3613 13.8434Z" fill="#98A2B3"/>
          </svg>
          <label htmlFor="log-email" className={style.label}>
            {serverLanguage?.username ?? 'Username'}
          </label>
        </div>
        <div className={style.input_box}>
          <input
            type="password"
            className={style.input_field}
            id="log-pass"
            required
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            name="passwordInput"
          />
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17C12.5304 17 13.0391 16.7893 13.4142 16.4142C13.7893 16.0391 14 15.5304 14 15C14 14.4696 13.7893 13.9609 13.4142 13.5858C13.0391 13.2107 12.5304 13 12 13C11.4696 13 10.9609 13.2107 10.5858 13.5858C10.2107 13.9609 10 14.4696 10 15C10 15.5304 10.2107 16.0391 10.5858 16.4142C10.9609 16.7893 11.4696 17 12 17ZM18 8C18.5304 8 19.0391 8.21071 19.4142 8.58579C19.7893 8.96086 20 9.46957 20 10V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V10C4 9.46957 4.21071 8.96086 4.58579 8.58579C4.96086 8.21071 5.46957 8 6 8H7V6C7 4.67392 7.52678 3.40215 8.46447 2.46447C9.40215 1.52678 10.6739 1 12 1C12.6566 1 13.3068 1.12933 13.9134 1.3806C14.52 1.63188 15.0712 2.00017 15.5355 2.46447C15.9998 2.92876 16.3681 3.47995 16.6194 4.08658C16.8707 4.69321 17 5.34339 17 6V8H18ZM12 3C11.2044 3 10.4413 3.31607 9.87868 3.87868C9.31607 4.44129 9 5.20435 9 6V8H15V6C15 5.20435 14.6839 4.44129 14.1213 3.87868C13.5587 3.31607 12.7956 3 12 3Z" fill="#98A2B3"/>
          </svg>
          <label htmlFor="log-pass" className={style.label}>
            {serverLanguage?.password ?? 'Password'}
          </label>
        </div>
        <p className="error_message">{message}</p>
        <div className={style.submit_btn}>
          <button
            type="submit"
            className={style.btn_submit}
            disabled={loading}
          >
            {loading ? 
              (serverLanguage?.loading ?? 'Loading...') : 
              (serverLanguage?.sign_in ?? 'Sign In')
            }
          </button>
        </div>
      </form>
      <div className={style.forgotPassword}>
        <Link href={"/forgetpassword"}>
          {serverLanguage?.forget_password ?? 'Forgot Password?'}
        </Link>
      </div>
    </div>
  </div>
</>
  );
}