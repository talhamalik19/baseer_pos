import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req) {
  try {
    const { phone, orderId, order_key, total, sid, auth_token, auth_phone } = await req.json();
console.log(phone, orderId, order_key, sid, auth_token)
    const client = twilio(
      sid,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: `Dear Customer, Invoice of your order ${orderId} of ${total}$ is ready. Click Here to view ${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}. Thank You for shopping with us.`,
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