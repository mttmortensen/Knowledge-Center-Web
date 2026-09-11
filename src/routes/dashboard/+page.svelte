<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi } from '$lib/api/stats';
	import type { Stats } from '$lib/types/api';
	import ContributionCalendar from '$lib/components/ContributionCalendar.svelte';
	import ActionTable from '$lib/components/ActionTable.svelte';

	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		loading = true;
		error = '';
		try {
			stats = await statsApi.get();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard stats.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	let topTag = $derived(stats?.TopTags[0] ?? null);
</script>

<div class="dashboard">
	<h1>Dashboard</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if stats}
		<div class="stat-cards">
			<div class="card stat-card">
				<span class="stat-label muted">Active Knowledge Nodes</span>
				<span class="stat-value">{stats.KnowledgeNodes.Active}</span>
			</div>
			<div class="card stat-card">
				<span class="stat-label muted">Archived Knowledge Nodes</span>
				<span class="stat-value">{stats.KnowledgeNodes.Archived}</span>
			</div>
			<div class="card stat-card">
				<span class="stat-label muted">Active Domains</span>
				<span class="stat-value">{stats.Domains.Active}</span>
			</div>
			<div class="card stat-card">
				<span class="stat-label muted">Archived Domains</span>
				<span class="stat-value">{stats.Domains.Archived}</span>
			</div>
			<div class="card stat-card">
				<span class="stat-label muted">Most Used Tag</span>
				<span class="stat-value">{topTag ? topTag.Name : '—'}</span>
				{#if topTag}
					<span class="muted">{topTag.Count} {topTag.Count === 1 ? 'use' : 'uses'}</span>
				{/if}
			</div>
		</div>

		<div class="dashboard-grid">
			<div class="card heatmap-card">
				<h2>Log Activity</h2>
				<ContributionCalendar data={stats.CtpByDay} />
			</div>

			<div class="card">
				<div class="row-between">
					<h2>Recent Actions</h2>
					<a href="/actions">View all</a>
				</div>
				{#if stats.RecentActions.length === 0}
					<div class="empty-state">No actions yet.</div>
				{:else}
					<ActionTable actions={stats.RecentActions} showNode />
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem 1rem 4rem;
	}
	@media (max-width: 640px) {
		.dashboard {
			padding: 1.1rem 0.85rem 3rem;
		}
	}

	.stat-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
		margin: 1.25rem 0 1.5rem;
	}
	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0;
	}
	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 800px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
	}
	.heatmap-card {
		min-width: 0;
	}

	h2 {
		margin-top: 0;
	}
</style>
