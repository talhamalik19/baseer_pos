export const runtime = "nodejs";

import { NextResponse } from "next/server";
// const twilio = require("twilio");
import { writeToLogFile } from "../schedule-email/route";

export async function POST(req) {
    const twilio = (await import("twilio")).default;

  writeToLogFile("Inside phone route");
  try {
    const { currencySymbol, phone, orderId, order_key, total, sid, auth_token, auth_phone, warehouseId } = await req.json();
    const client = twilio(
      sid,
      auth_token
    );
    writeToLogFile(phone, orderId, order_key, total, sid, auth_token, auth_phone, warehouseId)

    await client.messages.create({
      body: `Dear Customer, Invoice of your order ${orderId} of ${currencySymbol} ${total} is ready. Click Here to view ${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}&warehouse=${warehouseId}. Thank You for shopping with us.`,
      from: auth_phone,
      to: phone,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}