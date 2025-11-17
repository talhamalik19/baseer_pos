import { recheckConsentFromAPI } from "@/lib/Magento/actions";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sendEmailLogic } from "../email/route";

// Function to write logs to file

export async function POST(request) {
  const url = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  console.log(`API Base URL: ${baseUrl}`);

  try {
    const {
      email,
      phone,
      orderId,
      orderData,
      pdfBase64,
      pdfResponse,
      smsJob,
      warehouseId,
      smtp_config,
    } = await request.json();
    
    console.log(`Starting delayed consent check for order: ${orderId}`);
    console.log(`Email: ${email}, Phone: ${phone}`);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Re-checking consent for order: ${orderId}`);
    const updatedConsent = await recheckConsentFromAPI(email, phone);
    console.log(`Updated consent response: ${JSON.stringify(updatedConsent)}`);

    // if (!email && phone) {
    //   if (
    //     updatedConsent?.[0]?.success == true &&
    //     updatedConsent?.[0]?.email == "" &&
    //     updatedConsent?.[0]?.consent == null
    //   ) {
    //     console.log(`Sending Only SMS for order: ${orderId}`);
    //     await fetch(`${baseUrl}/api/phone`, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(smsJob),
    //     });
    //     console.log(`SMS sent successfully for order: ${orderId}`);
    //   }
    // }

    if (updatedConsent === "yes") {
      console.log(`Consent granted for order: ${orderId}`);

      if (email && pdfBase64) {
        console.log(`Sending delayed Email for order: ${orderId}`);
        try {
          const result = await sendEmailLogic({
            email,
            orderId,
            orderData,
            pdf: pdfBase64,
            pdfResponse,
            warehouseId,
            smtp_config,
          });
          
          console.log(`Email sent successfully: ${result.messageId}`);
        } catch (error) {
          console.log(`Email sending error: ${error.message}`);
          console.log(`Error stack: ${error.stack}`);
        }
      }

if (phone && smsJob) {
  console.log(`Sending delayed SMS for order: ${orderId}`);
  try {
    const res = await fetch(`${baseUrl}/api/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsJob),
    });
    
    if (!res.ok) {
      console.log(`SMS API returned status: ${res.status}`);
    }
    
    const responseText = await res.text();
    console.log(`SMS API raw response: ${responseText}`);
    
    if (responseText) {
      try {
        const result = JSON.parse(responseText);
        console.log(`SMS success: ${result?.success}`);
        console.log(`SMS error: ${result?.error}`);
      } catch (parseError) {
        console.log(`Failed to parse SMS response as JSON: ${parseError.message}`);
      }
    } else {
      console.log(`SMS API returned empty response`);
    }
    
    console.log(`SMS sent successfully for order: ${orderId}`);
  } catch (smsError) {
    console.log(`SMS sending failed: ${smsError.message}`);
  }
}
    } else {
      console.log(`Messages not sent - consent status: ${updatedConsent} for order: ${orderId}`);
    }

    console.log(`Successfully completed consent check for order: ${orderId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.log(`Error in delayed consent check: ${err.message}`);
    console.log(`Error stack: ${err.stack}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}