"use client";
import SimpleAlertModal from "@/components/global/alertModal";
import { submitConsentAction } from "@/lib/Magento/actions";
import React, { useEffect, useState } from "react";

export default function Consent({
  style,
  sessionId,
  email,
  phone,
  consentValue,
  expiresAt,
}) {
  // Default checked based on consentValue
  const [checked, setChecked] = useState(
    consentValue
      ? consentValue?.[0]?.success && consentValue?.[0]?.consent === "no"
        ? "no"
        : "yes"
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Number(expiresAt) - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Number(expiresAt) - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft <= 0) {
    return (
      <div className={style.consent_page}>
        <div className={style.consent_container}>
          <div>This consent link has expired</div>
        </div>{" "}
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const handleSubmit = async () => {
    // if (!checked) {
    //   alert("Please agree to the terms first");
    //   return;
    // }

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
      setIsOpen(true);
      setIsSubmitting(false);
    }

    // try {
    //   const response = await fetch("/api/consent", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       sessionId,
    //       email: email,
    //       phone: phone.length ? phone : "",
    //       consent: checked,
    //     }),
    //   });

    //   const result = await response.json();
    //   console.log("API response:", result);

    //   if (result.success) {
    //     alert("Consent submitted successfully! ✅");
    //   } else {
    //     alert("Failed to notify POS");
    //   }
    // } catch (err) {
    //   console.error("❌ Error submitting consent:", err);
    //   alert("Network error");
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <div className={style.consent_page}>
      <div className={style.consent_container}>
        <h2>Consent Certificate</h2>
        <p style={{ fontWeight: "bold", color: "red" }}>
          ⏳ Expires in {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
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
        <ul style={{ textAlign: "left", margin: "10px 0 0 20px" }}>
          <li>I have read and understood the purpose of this consent.</li>
          <li>
            I may withdraw my consent at any time by contacting [support
            email/phone].
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

        {/* Radio buttons instead of checkbox */}
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

      <SimpleAlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen((prev) => !prev)}
        title={"Consent Submitted"}
        message={"Thank You For Submitting your consent.."}
      />
    </div>
  );
}
