<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { logout } from '$lib/api/auth';

	let menuOpen = $state(false);

	async function handleLogout() {
		await logout();
		goto('/login');
	}

	function closeMenu() {
		menuOpen = false;
	}

	$effect(() => {
		page.url.pathname;
		menuOpen = false;
	});
</script>

<nav>
	<div class="nav-inner">
		<div class="nav-bar">
			<a href="/dashboard" class="brand" onclick={closeMenu}>KC</a>
			<button
				type="button"
				class="menu-toggle"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span class="menu-icon"></span>
			</button>
		</div>

		<div class="nav-collapse" class:open={menuOpen}>
			<div class="nav-links">
				<a href="/dashboard" onclick={closeMenu}>Dashboard</a>
				<a href="/domains" onclick={closeMenu}>Domains</a>
				<a href="/nodes" onclick={closeMenu}>Knowledge Nodes</a>
				<a href="/logs" onclick={closeMenu}>Logs</a>
				<a href="/actions" onclick={closeMenu}>Actions</a>
				<a href="/tags" onclick={closeMenu}>Tags</a>
			</div>
			<div class="nav-actions">
				{#if auth.isDemo}
					<span class="tag-pill">demo mode</span>
				{/if}
				<a href="/logs/new" onclick={closeMenu}><button class="primary">Add log</button></a>
				<a href="/actions/new" onclick={closeMenu}><button class="primary">Add action</button></a>
				<button onclick={handleLogout}>Log out</button>
			</div>
		</div>
	</div>
</nav>

<style>
	nav {
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
	}
	.nav-inner {
		display: flex;
		align-items: center;
		padding: 0.85rem 1.5rem;
		gap: 1.25rem;
	}
	.nav-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-shrink: 0;
	}
	.brand {
		font-weight: 700;
		color: var(--text);
		white-space: nowrap;
	}
	.menu-toggle {
		display: none;
		padding: 0.4rem 0.6rem;
		flex-shrink: 0;
	}
	.menu-icon,
	.menu-icon::before,
	.menu-icon::after {
		display: block;
		width: 18px;
		height: 2px;
		background: var(--text);
		position: relative;
	}
	.menu-icon::before,
	.menu-icon::after {
		content: '';
		position: absolute;
	}
	.menu-icon::before {
		top: -6px;
	}
	.menu-icon::after {
		top: 6px;
	}
	.nav-collapse {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		flex: 1;
		min-width: 0;
		gap: 0.75rem 1.25rem;
	}
	.nav-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
	}
	.nav-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	nav a {
		color: var(--text-muted);
	}
	nav a:hover {
		color: var(--text);
		text-decoration: none;
	}

	@media (max-width: 860px) {
		.nav-inner {
			flex-direction: column;
			align-items: stretch;
			padding: 0.75rem 1rem;
			gap: 0;
		}
		.nav-bar {
			justify-content: space-between;
		}
		.menu-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.nav-collapse {
			display: none;
			flex-direction: column;
			align-items: stretch;
			padding: 0.25rem 0 0.25rem;
			gap: 1rem;
		}
		.nav-collapse.open {
			display: flex;
		}
		.nav-links {
			flex-direction: column;
			gap: 0;
		}
		.nav-links a {
			padding: 0.65rem 0.1rem;
			border-bottom: 1px solid var(--border);
		}
		.nav-actions {
			flex-direction: column;
			align-items: stretch;
		}
		.nav-actions a,
		.nav-actions button {
			width: 100%;
		}
	}
</style>
