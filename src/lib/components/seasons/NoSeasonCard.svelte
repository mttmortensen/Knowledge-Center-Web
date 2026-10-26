<script lang="ts">
	import { onMount } from 'svelte';
	import { seasonsApi } from '$lib/api/seasons';
	import { auth } from '$lib/stores/auth.svelte';
	import { currentSeason } from '$lib/stores/season.svelte';
	import { formatRange } from '$lib/seasons/stats';
	import type { Season } from '$lib/types/api';

	// The dashboard's season card when none is active: offers the next planned
	// season, or planning one when there isn't any.

	let next = $state<Season | null>(null);
	let starting = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			const planned = await seasonsApi.getAll('Planned');
			next = [...planned].sort((a, b) => a.PlannedStart.localeCompare(b.PlannedStart))[0] ?? null;
		} catch {
			// Without the planned list the card still offers planning a season.
		}
	});

	async function start() {
		if (!next) return;
		starting = true;
		error = '';
		try {
			currentSeason.set(await seasonsApi.start(next.SeasonId));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start the season.';
		} finally {
			starting = false;
		}
	}
</script>

<div class="card no-season">
	<div class="row-between">
		<h2>No season running</h2>
		<a href="/seasons">Seasons</a>
	</div>

	{#if next}
		<p class="muted">
			Next up: <a href="/seasons/{next.SeasonId}">{next.Name}</a>, planned {formatRange(next)}.
		</p>
	{:else}
		<p class="muted">Pick one or two domains to focus on for the next few weeks.</p>
	{/if}

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<div class="row">
		{#if next}
			<button
				class="primary"
				onclick={start}
				disabled={auth.isDemo || starting || next.FocusCount === 0}
				title={next.FocusCount === 0 ? 'Add a Focus domain before starting' : undefined}
			>
				{starting ? 'Starting…' : 'Start it'}
			</button>
		{/if}
		{#if auth.isDemo}
			<button class:primary={!next} disabled>Plan a season</button>
		{:else}
			<a href="/seasons/new"><button class:primary={!next}>Plan a season</button></a>
		{/if}
	</div>
</div>

<style>
	.no-season {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 0;
		border-style: dashed;
	}
	h2 {
		margin: 0;
	}
	p {
		margin: 0;
	}
	.error-banner {
		margin: 0;
	}
	a:hover button {
		text-decoration: none;
	}
</style>
