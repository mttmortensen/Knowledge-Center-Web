<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';

	const WORKSPACES = [
		{ n: 1, label: 'DASHBOARD', href: '/dashboard' },
		{ n: 2, label: 'BROWSE', href: '/domains' },
		{ n: 3, label: 'ACTIONS', href: '/actions' },
		{ n: 4, label: 'TAGS', href: '/tags' }
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === '/domains') {
			return path.startsWith('/domains') || path.startsWith('/nodes') || path.startsWith('/logs');
		}
		return path.startsWith(href);
	}

	const bootTime = Date.now();
	let now = $state(new Date());
	let timer: ReturnType<typeof setInterval>;

	onMount(() => {
		timer = setInterval(() => (now = new Date()), 1000);
	});
	onDestroy(() => clearInterval(timer));

	function formatUptime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
		const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
		const s = String(totalSeconds % 60).padStart(2, '0');
		return `${h}:${m}:${s}`;
	}

	let uptime = $derived(formatUptime(now.getTime() - bootTime));
	let dateLabel = $derived(
		now.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
	);
	let timeLabel = $derived(now.toLocaleTimeString(undefined, { hour12: false }));
</script>

<div class="status-bar">
	<div class="workspaces">
		{#each WORKSPACES as ws (ws.n)}
			<button
				type="button"
				class="workspace"
				class:active={isActive(ws.href)}
				onclick={() => goto(ws.href)}
			>
				{ws.n}: {ws.label}
			</button>
		{/each}
		{#if auth.isDemo}
			<span class="workspace muted" style="cursor: default;">[DEMO MODE]</span>
		{/if}
	</div>
	<span class="app-name">KNOWLEDGE CENTER SETUP UTILITY</span>
	<div class="clock">
		<span class="muted">UPTIME {uptime}</span>
		<span>{dateLabel} {timeLabel}</span>
	</div>
</div>
