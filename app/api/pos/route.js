import { savePosData } from "@/lib/posStorage";
import { cookies } from "next/headers";

export async function POST(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  const body = await req.json();
  const { pos_code, ip_address } = body;

  if (!pos_code || !ip_address) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing pos_code or ip_address" }),
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rest/V1/fme/registerPos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pos_code, ip_address }),
    });

    // First check if the response is OK (status 200-299)
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorData}`);
    }

    // Then parse the JSON
    const result = await response.json();

    if (!Array.isArray(result)) {
      throw new Error(`Unexpected response format from API. Expected array but got ${typeof result}`);
    }

    const [success, payload] = result;

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, message: payload?.message || "Registration failed" }),
        { status: 400 }
      );
    }

    // ✅ Save POS data to disk
    // const saved = await savePosData(payload);

    // if (!saved) {
    //   throw new Error("Failed to save POS data locally.");
    // }
    cookieStore.set("pos_code", payload?.posData?.pos_code)
    return new Response(
      JSON.stringify({ success: true, message: "POS registered successfully.", data: payload }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in POS registration:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: err.message || "An unexpected error occurred"
      }),
      { status: err instanceof Error ? 500 : 400 }
    );
  }
}