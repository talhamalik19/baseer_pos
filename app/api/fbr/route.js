export async function POST(req) {
  try {
    const body = await req.json();
    const headers = {
      "Content-Type": "application/json",
    };

    const { token: frontendToken, mode, ...payload } = body;
    const token =
      mode === "development"
        ? "1298b5eb-b252-3d97-8622-a4a69d5bf818"
        : frontendToken || "";

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Conditionally disable TLS check only for development/sandbox
    if (mode === "development") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const url =
      mode === "development"
        ? "https://esp.fbr.gov.pk:8244/FBR/v1/api/Live/PostData" // sandbox
        : "https://gw.fbr.gov.pk/imsp/v1/api/Live/PostData"; // production

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error("FBR Proxy Error:", err);
    return Response.json(
      { error: "Network error", message: err.message },
      { status: 500 }
    );
  }
}
