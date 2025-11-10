import React from "react";
import style from "./consent.module.scss";
import { getConsent } from "@/lib/Magento/restAPI";
import { decryptData } from "@/lib/crypto";
import Consent from "@/components/blocks/Consent";

export default async function ConsentPage({ searchParams }) {
  const params = await searchParams;
  const encrypted = params?.data;
  
  if (!encrypted) {
    return (
      <div className={style.consent_page}>
        <div className={style.consent_container}>
          <div>Invalid Link</div>
        </div>
      </div>
    );
  }

  let sessionId, phone, email, expiresAt;
  try {
    const { sessionId: s, phone: p, email: e, expiresAt: exp } = decryptData(encrypted);
    sessionId = s;
    phone = p;
    email = e;
    expiresAt = exp;
  } catch (err) {
    console.error("Decryption failed:", err);
    return (
      <div className={style.consent_page}>
        <div className={style.consent_container}>
          <div>Invalid Link</div>
        </div>
      </div>
    );
  }
  // Check if the link has expired (only if expiresAt is not null)
if (expiresAt !== null && Date.now() > expiresAt) {
  return (
    <div className={style.consent_page}>
      <div className={style.consent_container}>
        <div>Link has expired</div>
      </div>
    </div>
  );
}

  const consentValue = await getConsent(email, phone);

  return (
    <div className={style.consent_page}>
      <Consent
        sessionId={sessionId}
        phone={phone}
        email={email}
        consentValue={consentValue}
        style={style}
        expiresAt={expiresAt}
      />
    </div>
  );
}
