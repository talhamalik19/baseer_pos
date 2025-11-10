"use client";
import { submitConsentAction } from "@/lib/Magento/actions";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function Consent({
  style,
  sessionId,
  email,
  phone,
  consentValue,
  expiresAt,
}) {
  const [isClient, setIsClient] = useState(false);
  const [isConsentSubmitted, setIsConsentSubmitted] = useState(false);
  const [checked, setChecked] = useState(
    consentValue
      ? consentValue?.[0]?.success && consentValue?.[0]?.consent === "no"
        ? "no"
        : "yes"
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    expiresAt ? Number(expiresAt) - Date.now() : null
  );

  useEffect(() => {
    setIsClient(true);
    const saved = sessionStorage.getItem("consent_submitted");
    if (saved === "true") setIsConsentSubmitted(true);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Number(expiresAt) - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!isClient) return null;

  if (expiresAt && timeLeft <= 0 && !isConsentSubmitted) {
    return (
      <div className={style.consent_page}>
        <div className={style.consent_container}>
          <div>This consent link has expired</div>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const handleSubmit = async () => {
    if (!sessionId) {
      alert("Invalid session ID");
      return;
    }
    if (!checked) {
      alert("Please select an option");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      increment_id: sessionId,
      customer_email: email || "",
      phone_number: phone?.length ? phone : "",
      consent: checked,
    };

    const res = await submitConsentAction(payload);

    if (res?.[0]?.success) {
      sessionStorage.setItem("consent_submitted", "true");
      setIsConsentSubmitted(true);
    }

    setIsSubmitting(false);
  };

  if (isConsentSubmitted) {
    return (
      <div className={style.consent_page}>
        <div className={style.consent_container}>
          <div className={style.thank}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6" width={90} height={90}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="green" />
</svg>

          <h2>Thank You!</h2>
          <p>Thank you for submitting your consent.</p>
          {/* <button
            onClick={() => {
              sessionStorage.removeItem("consent_submitted");
              setIsConsentSubmitted(false);
            }}
          >
            OK
          </button> */}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={style.consent_page}>
      <div className={style.consent_container}>
            <Image src={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/desktop_logo.png`} alt="Logo" width={148} height={40} />
        <h2>Consent Certificate</h2>
        {expiresAt != null && (
          <p className={style.timer}>
            ⏳ Expires in {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        )}
        <p>
          By signing/submitting this form, I confirm that the information
          provided is accurate and complete to the best of my knowledge.
        </p>
        <p>
          I understand that <strong>Baseer</strong> will collect, store, and use
          my personal information in accordance with Canadian privacy laws
          (PIPEDA) and international data protection regulations, including
          GDPR.
        </p>
        <p>
          I consent to receiving Smart Receipts and related service
          notifications via WhatsApp and Email. I understand that my contact
          details will only be used for this purpose and will not be shared with
          unauthorized third parties.
        </p>
        <p>I acknowledge that:</p>
        <ul style={{ textAlign: "left", margin: "10px 0px 10px 45px" }}>
          <li>I have read and understood the purpose of this consent.</li>
          <li>
            I may withdraw my consent at any time.
          </li>
          <li>
            Upon withdrawal, no further Smart Receipts or related communications
            will be sent.
          </li>
          <li>
            My data will be handled securely and only retained as long as
            necessary for service delivery.
          </li>
        </ul>

        <div className={style.cb}>
          <label>
            <input
              type="radio"
              name="consent"
              value="yes"
              checked={checked === "yes"}
              onChange={(e) => setChecked(e.target.value)}
              disabled={isSubmitting || !sessionId}
            />
            I accept
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="consent"
              value="no"
              checked={checked === "no"}
              onChange={(e) => setChecked(e.target.value)}
              disabled={isSubmitting || !sessionId}
            />
            I do not accept
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            opacity: isSubmitting ? 0.6 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
