# Knowledge Center

SvelteKit + TipTap rewrite of the Knowledge Center journal/docs app. Talks to the
[Knowledge-Center-API](https://github.com/mttmortensen/Knowledge-Center-API) (ASP.NET Core,
Postgres) at `https://api.mortensens.cc/kc/api` (see `src/lib/api/config.ts`).

## Developing

```sh
npm install
npm run dev
```

## Building

Builds a static SPA (adapter-static, `fallback: index.html`) to `build/` — no Node
process needed at runtime, nginx serves the output directly.

```sh
npm run build
npm run preview   # serve the production build locally
```

## Auth / demo mode

Session token lives in `sessionStorage` (`kc_token`, `kc_is_demo`). Demo mode is
server-driven (`src/lib/stores/auth.svelte.ts` + `src/lib/api/client.ts`): reads
return the API's seeded demo dataset, creates return a fake unsaved object, and
updates/deletes are blocked (403, disabled in the UI via `auth.isDemo`).
