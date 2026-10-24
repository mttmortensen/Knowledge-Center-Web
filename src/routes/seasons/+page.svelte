<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { seasonsApi } from '$lib/api/seasons';
	import { auth } from '$lib/stores/auth.svelte';
	import { currentSeason } from '$lib/stores/season.svelte';
	import { formatDay, formatRange } from '$lib/seasons/stats';
	import type { Season } from '$lib/types/api';
	import SeasonTimeline from '$lib/components/seasons/SeasonTimeline.svelte';

	let seasons = $state<Season[]>([]);
	let loading = $state(true);
	let error = $state('');
	let starting = $state<number | null>(null);

	const hasActive = $derived(seasons.some((s) => s.Status === 'Active'));

	async function load() {
		loading = true;
		error = '';
		try {
			seasons = await seasonsApi.getAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load seasons.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function start(season: Season) {
		starting = season.SeasonId;
		error = '';
		try {
			const started = await seasonsApi.start(season.SeasonId);
			currentSeason.set(started);
			goto(`/seasons/${started.SeasonId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start the season.';
		} finally {
			starting = null;
		}
	}

	function summary(s: Season): string {
		const roles = `${s.FocusCount} focus · ${s.PassiveCount} passive`;
		if (s.Status === 'Active')
			return s.IsOverdue
				? `Day ${s.DaysElapsed} of ${s.DaysPlanned} · past planned end · ${roles}`
				: `Day ${s.DaysElapsed} of ${s.DaysPlanned} · ${s.DaysRemaining} left · ${roles}`;
		if (s.Status === 'Ended') return `${s.DaysElapsed} days · ${roles}`;
		return `${s.DaysPlanned} days · starts ${formatDay(s.PlannedStart)} · ${roles}`;
	}
</script>

<div class="container">
	<div class="row-between">
		<h1>Seasons</h1>
		{#if auth.isDemo}
			<button class="primary" disabled>Plan a season</button>
		{:else}
			<a href="/seasons/new"><button class="primary">Plan a season</button></a>
		{/if}
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if seasons.length === 0}
		<div class="card empty-state">
			<p>No seasons yet.</p>
			<p class="muted">
				A season gives one or two domains your main attention for a few weeks, and keeps the rest
				passive or resting.
			</p>
		</div>
	{:else}
		<SeasonTimeline {seasons} />

		<div class="card season-list">
			{#each seasons as s (s.SeasonId)}
				<div class="season-row">
					<div class="info">
						<div class="row">
							<span class="tag-pill status {s.Status.toLowerCase()}">{s.Status}</span>
							<a class="name" href="/seasons/{s.SeasonId}">{s.Name}</a>
						</div>
						<div class="muted">{formatRange(s)} · {summary(s)}</div>
					</div>
					<div class="row">
						{#if s.Status === 'Planned' && !hasActive}
							<button
								class="primary"
								onclick={() => start(s)}
								disabled={auth.isDemo || s.FocusCount === 0 || starting !== null}
								title={s.FocusCount === 0 ? 'Add a Focus domain before starting' : undefined}
							>
								{starting === s.SeasonId ? 'Starting…' : 'Start'}
							</button>
						{/if}
						<a href="/seasons/{s.SeasonId}"><button>Open</button></a>
					</div>
				</div>
			{/each}
		</div>
		{#if auth.isDemo}
			<p class="muted">Planning and starting seasons are disabled in demo mode.</p>
		{/if}
	{/if}
</div>

<style>
	.season-list {
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
	}
	.season-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0.8rem 0;
		border-top: 1px solid var(--border);
	}
	.season-row:first-child {
		border-top: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.name {
		color: var(--text);
		font-weight: 600;
	}
	.status.active {
		color: var(--success);
		border-color: var(--success);
	}
	.status.planned {
		border-style: dashed;
	}
	a:hover button {
		text-decoration: none;
	}
</style>
