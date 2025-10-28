import { recheckConsentFromAPI } from "@/lib/Magento/actions";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sendEmailLogic } from "../email/route";

// Function to write logs to file
function writeToLogFile(message) {
  const logDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logDir, "consent-check-logs.txt");

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(logFile, logMessage, "utf8");
  console.log(message);
}

export async function POST(request) {
  const url = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  writeToLogFile(`API Base URL: ${baseUrl}`);

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
    
    writeToLogFile(`Starting delayed consent check for order: ${orderId}`);
    writeToLogFile(`Email: ${email}, Phone: ${phone}`);

    await new Promise((resolve) => setTimeout(resolve, 240000));

    writeToLogFile(`Re-checking consent for order: ${orderId}`);
    const updatedConsent = await recheckConsentFromAPI(email, phone);
    writeToLogFile(`Updated consent response: ${JSON.stringify(updatedConsent)}`);

    if (!email && phone) {
      if (
        updatedConsent?.[0]?.success == true &&
        updatedConsent?.[0]?.email == "" &&
        updatedConsent?.[0]?.consent == null
      ) {
        writeToLogFile(`Sending Only SMS for order: ${orderId}`);
        await fetch(`${baseUrl}/api/phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsJob),
        });
        writeToLogFile(`SMS sent successfully for order: ${orderId}`);
      }
    }

    if (updatedConsent === "yes") {
      writeToLogFile(`Consent granted for order: ${orderId}`);

      if (email && pdfBase64) {
        writeToLogFile(`Sending delayed Email for order: ${orderId}`);
        try {
          // Call the function directly instead of using fetch
          const result = await sendEmailLogic({
            email,
            orderId,
            orderData,
            pdf: pdfBase64,
            pdfResponse,
            warehouseId,
            smtp_config,
          });
          
          writeToLogFile(`Email sent successfully: ${result.messageId}`);
        } catch (error) {
          writeToLogFile(`Email sending error: ${error.message}`);
          writeToLogFile(`Error stack: ${error.stack}`);
        }
      }

      if (phone && smsJob) {
        writeToLogFile(`Sending delayed SMS for order: ${orderId}`);
        await fetch(`${baseUrl}/api/phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsJob),
        });
        writeToLogFile(`SMS sent successfully for order: ${orderId}`);
      }
    } else {
      writeToLogFile(`Messages not sent - consent status: ${updatedConsent} for order: ${orderId}`);
    }

    writeToLogFile(`Successfully completed consent check for order: ${orderId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    writeToLogFile(`Error in delayed consent check: ${err.message}`);
    writeToLogFile(`Error stack: ${err.stack}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}