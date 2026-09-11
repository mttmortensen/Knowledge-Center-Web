<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi } from '$lib/api/stats';
	import { actionsApi } from '$lib/api/actions';
	import type { Stats, RecentAction } from '$lib/types/api';
	import ContributionCalendar from '$lib/components/ContributionCalendar.svelte';
	import StreakStat from '$lib/components/StreakStat.svelte';

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
	let logTotal = $derived(stats?.CtpByDay.reduce((sum, day) => sum + day.Count, 0) ?? 0);
	let actionTotal = $derived(stats?.ActionsByDay.reduce((sum, day) => sum + day.Count, 0) ?? 0);

	function statusLabel(status: string): string {
		return status === 'Completed' ? 'Closed' : status;
	}
</script>

<div class="dashboard">
	<h1>Dashboard</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if stats}
		<div class="stat-strip">
			<div class="stat-field">
				<span class="stat-label">Active Nodes</span>
				<span class="stat-value">{stats.KnowledgeNodes.Active}</span>
			</div>
			<div class="stat-field">
				<span class="stat-label">Archived Nodes</span>
				<span class="stat-value">{stats.KnowledgeNodes.Archived}</span>
			</div>
			<div class="stat-field">
				<span class="stat-label">Active Domains</span>
				<span class="stat-value">{stats.Domains.Active}</span>
			</div>
			<div class="stat-field">
				<span class="stat-label">Archived Domains</span>
				<span class="stat-value">{stats.Domains.Archived}</span>
			</div>
			<div class="stat-field">
				<span class="stat-label">Most Used Tag</span>
				<span class="stat-value stat-value-small">
					{#if topTag}{topTag.Name} · {topTag.Count}{:else}—{/if}
				</span>
			</div>
		</div>

		<div class="dashboard-grid">
			<div class="heatmaps-col">
				<div class="card heatmap-card">
					<h2>Core Memory Bank A: Log Activity</h2>
					<StreakStat
						currentStreak={stats.LogStreak.CurrentStreak}
						longestStreak={stats.LogStreak.LongestStreak}
						totalCount={logTotal}
						totalSingular="entry logged"
						totalPlural="entries logged"
					/>
					<ContributionCalendar data={stats.CtpByDay} singular="log entry" plural="log entries" />
				</div>

				<div class="card heatmap-card">
					<h2>Core Memory Bank B: Completed Actions</h2>
					<StreakStat
						currentStreak={stats.ActionStreak.CurrentStreak}
						longestStreak={stats.ActionStreak.LongestStreak}
						totalCount={actionTotal}
						totalSingular="action completed"
						totalPlural="actions completed"
					/>
					<ContributionCalendar
						data={stats.ActionsByDay}
						singular="completed action"
						plural="completed actions"
					/>
				</div>
			</div>

			<div class="card recent-actions-card">
				<div class="row-between">
					<h2>Recent Actions</h2>
					<a href="/actions" class="f-key-jump">
						<span class="key">F4</span>
						<span class="key-label">view all</span>
					</a>
				</div>
				{#if recentActionsError}
					<div class="error-banner">{recentActionsError}</div>
				{:else if recentActionsLoading}
					<p class="muted">Loading…</p>
				{:else if recentActions.length === 0}
					<div class="empty-state">No actions yet.</div>
				{:else}
					<div class="action-rows">
						{#each recentActions as action, i (action.Id)}
							<a href="/actions/{action.Id}" class="list-item action-row" class:selected={i === 0}>
								<span class="action-title">
									<span
										class="tag-pill"
										class:open={action.Status === 'Open'}
										class:completed={action.Status === 'Completed'}
									>
										{statusLabel(action.Status)}
									</span>
									{action.ActionText}
								</span>
								<span class="action-date">
									{new Date(action.CompletedAt ?? action.CreatedAt).toLocaleDateString()}
								</span>
							</a>
						{/each}
					</div>
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

	.stat-strip {
		display: flex;
		border: 1px solid var(--cyan-dim);
		margin: 1.25rem 0 1.5rem;
		overflow-x: auto;
	}
	.stat-field {
		flex: 1;
		min-width: 130px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.6rem 0.9rem;
		border-right: 1px solid var(--cyan-dim);
	}
	.stat-field:last-child {
		border-right: none;
	}
	.stat-label {
		color: var(--yellow);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		font-size: 0.72rem;
	}
	.stat-value {
		color: var(--white);
		font-size: 1.4rem;
		font-weight: 700;
	}
	.stat-value-small {
		font-size: 0.95rem;
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	.f-key-jump {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		text-decoration: none;
	}
	.f-key-jump .key {
		display: inline-block;
		background: var(--select-bg);
		color: var(--select-text);
		font-weight: 700;
		padding: 0.05rem 0.4rem;
		border: 1px solid var(--white);
		font-size: 0.75rem;
	}
	.f-key-jump .key-label {
		color: var(--cyan);
		font-size: 0.85rem;
	}
	.f-key-jump:hover .key-label {
		color: var(--yellow);
	}

	.action-rows {
		border-top: 1px solid var(--bios-blue-dark);
	}
	.recent-actions-card .action-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.action-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.action-date {
		flex-shrink: 0;
		color: var(--cyan-dim);
		font-size: 0.78rem;
	}
	.recent-actions-card .action-row.selected .action-date,
	.recent-actions-card .action-row:hover .action-date {
		color: var(--bios-blue-dark);
	}
	/* The shared .list-item:hover only lightens the background; here hover
	   should read exactly like the top row's inverted block. */
	.recent-actions-card .action-row:hover {
		background: var(--select-bg);
		color: var(--select-text);
		text-decoration: none;
	}
</style>
