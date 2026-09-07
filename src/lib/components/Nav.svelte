<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { logout } from '$lib/api/auth';

	async function handleLogout() {
		await logout();
		goto('/login');
	}
</script>

<nav class="row-between">
	<div class="row" style="gap: 1.25rem;">
		<a href="/domains" style="font-weight: 700; color: var(--text);">Knowledge Center</a>
		<a href="/domains">Domains</a>
		<a href="/tags">Tags</a>
	</div>
	<div class="row">
		{#if auth.isDemo}
			<span class="tag-pill">demo mode</span>
		{/if}
		<button onclick={handleLogout}>Log out</button>
	</div>
</nav>

<style>
	nav {
		padding: 0.85rem 1.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
	}
	nav a {
		color: var(--text-muted);
	}
	nav a:hover {
		color: var(--text);
		text-decoration: none;
	}
</style>
