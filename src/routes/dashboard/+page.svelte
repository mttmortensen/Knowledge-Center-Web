<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi } from '$lib/api/stats';
	import { actionsApi } from '$lib/api/actions';
	import type { Stats, RecentAction } from '$lib/types/api';
	import ContributionCalendar from '$lib/components/ContributionCalendar.svelte';
	import StreakStat from '$lib/components/StreakStat.svelte';
	import ActionTable from '$lib/components/ActionTable.svelte';

	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let error = $state('');

	let recentActions = $state<RecentAction[]>([]);
	let recentActionsLoading = $state(true);
	let recentActionsError = $state('');

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

	async function loadRecentActions() {
		recentActionsLoading = true;
		recentActionsError = '';
		try {
			recentActions = await actionsApi.getRecent();
		} catch (err) {
			recentActionsError = err instanceof Error ? err.message : 'Failed to load recent actions.';
		} finally {
			recentActionsLoading = false;
		}
	}

	onMount(() => {
		load();
		loadRecentActions();
	});

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
			<div class="heatmaps-col">
				<div class="card heatmap-card">
					<h2>Log Activity</h2>
					<StreakStat
						currentStreak={stats.LogStreak.CurrentStreak}
						longestStreak={stats.LogStreak.LongestStreak}
						lastEntryDate={stats.LogStreak.LastEntryDate}
						label="log entry"
					/>
					<ContributionCalendar data={stats.CtpByDay} />
				</div>

				<div class="card heatmap-card">
					<h2>Completed Actions</h2>
					<StreakStat
						currentStreak={stats.ActionStreak.CurrentStreak}
						longestStreak={stats.ActionStreak.LongestStreak}
						lastEntryDate={stats.ActionStreak.LastEntryDate}
						label="completed action"
					/>
					<ContributionCalendar
						data={stats.ActionsByDay}
						singular="completed action"
						plural="completed actions"
						variant="action"
					/>
				</div>
			</div>

			<div class="card">
				<div class="row-between">
					<h2>Recent Actions</h2>
					<a href="/actions">View all</a>
				</div>
				{#if recentActionsError}
					<div class="error-banner">{recentActionsError}</div>
				{:else if recentActionsLoading}
					<p class="muted">Loading…</p>
				{:else if recentActions.length === 0}
					<div class="empty-state">No actions yet.</div>
				{:else}
					<ActionTable actions={recentActions} showNode />
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 1600px;
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
	.heatmaps-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}
	.heatmap-card {
		min-width: 0;
	}

	h2 {
		margin-top: 0;
	}
</style>
