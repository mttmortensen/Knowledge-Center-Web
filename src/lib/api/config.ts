// Not a secret — this mirrors the previous vanilla-TS app's hardcoded API_BASE_URL.
// Override locally by editing this file if you need to point at a different API
// (e.g. a Kestrel instance on localhost) during development.
const PROD_API_BASE_URL = 'https://api.mortensens.cc/kc/api';

// In dev, requests go through the Vite proxy (see `server.proxy` in vite.config.ts)
// so they stay same-origin — the API rejects localhost origins with CORS.
export const API_BASE_URL = import.meta.env.DEV ? '/kc/api' : PROD_API_BASE_URL;
