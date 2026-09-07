// Fully client-driven SPA: auth lives in sessionStorage, there's no server to render
// against, and the static adapter's fallback (index.html) handles deep links.
export const ssr = false;
export const prerender = false;
