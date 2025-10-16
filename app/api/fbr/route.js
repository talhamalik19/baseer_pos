process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function POST(req) {
  try {
    const body = await req.json();

    const headers = {
      "Content-Type": "application/json",
    };

    // Extract token and mode correctly
    const { token: frontendToken, mode, ...payload } = body;

    // Select token based on mode
    const token =
      mode === "development"
        ? "1298b5eb-b252-3d97-8622-a4a69d5bf818" // dev token
        : frontendToken || ""; // production/frontend token

    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Send data to FBR
    const res = await fetch(
      "https://esp.fbr.gov.pk:8244/FBR/v1/api/Live/PostData",
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

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
