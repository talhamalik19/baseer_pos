import { initWebSocketServer, notifyConsent } from "@/server";

initWebSocketServer(); 

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { sessionId, email, phone, consent } = await req.json();
  if (!sessionId) {
    return Response.json({ success: false, error: "Missing sessionId" }, { status: 400 });
  }

  // notifyConsent(sessionId, {
  //   type: "consent_granted",
  //   email,
  //   phone,
  //   timestamp: Date.now(),
  //   consent
  // });

  return Response.json({ success: true });
}
