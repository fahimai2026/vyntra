export async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type");
  
  if (!response.ok) {
    let errData: any = {};
    if (contentType && contentType.includes("application/json")) {
      errData = await response.json().catch(() => ({}));
    }
    throw new Error(errData?.error || errData?.message || `API request failed with status ${response.status}`);
  }

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  // If it's OK but not JSON (like Vite's HTML fallback)
  const text = await response.text();
  throw new Error("Unexpected response from API (expected JSON, got HTML/text). Endpoint might be missing.");
}
