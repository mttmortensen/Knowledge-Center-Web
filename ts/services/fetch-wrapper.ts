export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("token");

  const headers = {
    ...(init.headers || {}),
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  return fetch(input, {
    ...init,
    headers
  });
}
