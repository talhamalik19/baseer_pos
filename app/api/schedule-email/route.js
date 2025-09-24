import { recheckConsentFromAPI } from "@/lib/Magento/actions";
import { NextResponse } from "next/server";

export async function POST(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
    console.log("API", baseUrl)
  try {
    const { email, phone, orderId, orderData, pdfBase64, pdfResponse, smsJob } =
      await request.json();
    await new Promise((resolve) => setTimeout(resolve, 240000));

    console.log("Re-checking consent for order:", orderId);
    const updatedConsent = await recheckConsentFromAPI(email, phone);
    if(!email && phone){
    if(updatedConsent?.[0]?.success == true && updatedConsent?.[0]?.email == "" && updatedConsent?.[0]?.consent == null){
        console.log("Sending Only SMS for order:", orderId);
        await fetch(`${baseUrl}/api/phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsJob),
        });
    }
  }
    if (updatedConsent === "yes") {
      if (email && pdfBase64) {
        console.log("Sending delayed Email for order:", orderId);
        await fetch(`${baseUrl}/api/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            orderId,
            orderData,
            pdf: pdfBase64,
            pdfResponse,
          }),
        });
      }

      if (phone && smsJob) {
        console.log("Sending delayed SMS for order:", orderId);
        await fetch(`${baseUrl}/api/phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsJob),
        });
      }
    } else {
      console.log("Messages not sent - consent status:", updatedConsent);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in delayed consent check:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
