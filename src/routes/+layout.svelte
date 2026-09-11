<script lang="ts">
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import FunctionKeyBar from '$lib/components/FunctionKeyBar.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import { palette } from '$lib/stores/palette.svelte';
	import { isTypingTarget } from '$lib/utils/keyboard';

	let { children } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		if (!isLoginPage && !auth.isAuthenticated) {
			goto('/login');
		}
	});

	const WORKSPACE_ROUTES: Record<string, string> = {
		'1': '/dashboard',
		'2': '/domains',
		'3': '/actions',
		'4': '/tags'
	};

	function onKeydown(e: KeyboardEvent) {
		if (!e.altKey || isTypingTarget(e.target)) return;
		if (e.key.toLowerCase() === 'f') {
			e.preventDefault();
			palette.toggle();
			return;
		}
		const route = WORKSPACE_ROUTES[e.key];
		if (route) {
			e.preventDefault();
			goto(route);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Knowledge Center</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

{#if isLoginPage || !auth.isAuthenticated}
	{#if isLoginPage}
		{@render children()}
	{/if}
{:else}
	<div class="app-shell">
		<StatusBar />
		<main class="app-main">
			{@render children()}
		</main>
		<FunctionKeyBar />
	</div>
	<CommandPalette />
{/if}
