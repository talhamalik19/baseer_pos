export async function submitRecordToFbr(payload) {
  try {
    const response = await fetch(`https://esp.fbr.gov.pk:8244/FBR/v1/api/Live/PostData`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization" : "Bearer 1298b5eb-b252-3d97-8622-a4a69d5bf818"
       },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to submit record to FBR");
    }

    const result = await response.json();
    return result; 
  } catch (error) {
    console.error("FBR submission error:", error);
    return null;
  }
}
