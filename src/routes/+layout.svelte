<script lang="ts">
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		if (!isLoginPage && !auth.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Knowledge Center</title>
</svelte:head>

{#if !isLoginPage && auth.isAuthenticated}
	<Nav />
{/if}

{#if isLoginPage || auth.isAuthenticated}
	{@render children()}
{/if}
