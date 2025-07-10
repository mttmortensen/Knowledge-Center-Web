export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("token");

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>), // safely spread existing headers
    "Content-Type": "application/json"
  };
  
  // Add Authorization header if token exists for API
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(input, {
    ...init,
    headers
  });
}
