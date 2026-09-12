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

## Deploying

One command from a dev machine — it SSHes to the build host (MRTN-LAPPS) and runs
`deploy.sh` there:

```sh
npm run deploy
```

`deploy.sh` pulls `origin/main`, runs `npm ci` and `npm run build`, restarts the
`knowledge-center-web` systemd service (`sirv build --single` on port 5067, fronted
by the nginx CT for kc.mortensens.cc), then health-checks the service before
reporting the deployed commit. It aborts if the host checkout is on another branch
or if the restarted service doesn't answer with 200.

It deploys what is on `origin/main`, so push first. Override `KC_APP_DIR`,
`KC_BRANCH`, `KC_SERVICE` or `KC_PORT` if any of that moves.

## Auth / demo mode

Session token lives in `sessionStorage` (`kc_token`, `kc_is_demo`). Demo mode is
server-driven (`src/lib/stores/auth.svelte.ts` + `src/lib/api/client.ts`): reads
return the API's seeded demo dataset, creates return a fake unsaved object, and
updates/deletes are blocked (403, disabled in the UI via `auth.isDemo`).
