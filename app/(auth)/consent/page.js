import React from "react";
import style from "./consent.module.scss";
import Consent from "@/components/blocks/Consent";
import { getConsent } from "@/lib/Magento/restAPI";
import { decryptData } from "@/lib/crypto";

export default async function ConsentPage({ searchParams }) {
  const encrypted = searchParams?.data;
  
  if (!encrypted) {
    return <div>❌ Invalid link</div>;
  }

  let sessionId, phone, email;
  try {
    const { sessionId: s, phone: p, email: e } = decryptData(encrypted);
    sessionId = s;
    phone = p;
    email = e;
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return <div>❌ Invalid or tampered data</div>;
  }
  console.log(sessionId, email, phone)
  const consentValue = await getConsent(email, phone);
console.log("consentValue", consentValue)
  return (
    <div>
      <Consent
        sessionId={sessionId}
        phone={phone}
        email={email}
        consentValue={consentValue}
        style={style}
      />
    </div>
  );
}
