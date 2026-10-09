import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static build: nginx serves the output directly, no Node process on the host.
			// fallback: 'index.html' makes this an SPA so client-side routing works for
			// deep links (nginx should `try_files $uri /index.html`).
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false
			})
		})
	],

	// Dev only. The real API doesn't send CORS headers for localhost origins, so the
	// browser can't call it directly from `vite dev`. Proxying keeps API requests
	// same-origin during development; production builds hit the API URL directly
	// (see src/lib/api/config.ts). Set KC_API_PROXY_TARGET (e.g. http://localhost:5131)
	// to develop against a locally running API instead.
	server: {
		proxy: {
			'/kc/api': {
				// loadEnv also picks up KC_* variables set in the shell, not just .env files.
				target: loadEnv(mode, '.', 'KC_').KC_API_PROXY_TARGET || 'https://api.mortensens.cc',
				changeOrigin: true,
				secure: true
			}
		}
	},

	test: {
		include: ['src/**/*.test.ts']
	}
}));
