<script lang="ts">
	import type { SeasonDetails } from '$lib/types/api';
	import { idleFocusDomains, progressPercent } from '$lib/seasons/stats';
	import RolePill from './RolePill.svelte';

	// The active season at the top of the dashboard. Not shown when no season is active.
	let { season }: { season: SeasonDetails } = $props();

	const idle = $derived(season.Stats ? idleFocusDomains(season.Stats) : []);
	const share = $derived(season.Stats?.FocusShare ?? 0);
	const r = 30;
	const circumference = 2 * Math.PI * r;
</script>

<a class="card card-link strip" href="/seasons/{season.SeasonId}">
	<div class="main">
		<div class="row-between">
			<div class="row">
				<span class="eyebrow">Current season</span>
				{#if season.IsOverdue}
					<span class="tag-pill archived">Past planned end</span>
				{/if}
			</div>
			<span class="muted">
				Day {season.DaysElapsed} of {season.DaysPlanned}
				{#if !season.IsOverdue}· {season.DaysRemaining} left{/if}
			</span>
		</div>
		<h2>{season.Name}</h2>
		<div class="season-progress"><span style:width="{progressPercent(season)}%"></span></div>
		<div class="chips">
			{#each season.Domains as d (d.DomainId)}
				<RolePill role={d.Role} label={d.DomainName} />
			{/each}
		</div>
		{#if idle.length}
			<div class="callout">
				<strong>Heads up</strong>
				<span
					>{idle.map((d) => d.DomainName).join(', ')}
					{idle.length === 1 ? "hasn't" : "haven't"} had any work in {season.DaysElapsed} days.</span
				>
			</div>
		{/if}
	</div>
	<svg class="ring" viewBox="0 0 72 72" role="img" aria-label="Focus share {share}%">
		<circle cx="36" cy="36" {r} fill="none" stroke="var(--bg-hover)" stroke-width="7" />
		<circle
			cx="36"
			cy="36"
			{r}
			fill="none"
			stroke="var(--season-focus)"
			stroke-width="7"
			stroke-linecap="round"
			stroke-dasharray="{(circumference * share) / 100} {circumference}"
			transform="rotate(-90 36 36)"
		/>
		<text x="36" y="36" text-anchor="middle" fill="var(--text)" font-size="14" font-weight="600"
			>{Math.round(share)}%</text
		>
		<text x="36" y="49" text-anchor="middle" fill="var(--text-muted)" font-size="8">focus</text>
	</svg>
</a>

<style>
	.strip {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1.25rem;
		align-items: center;
	}
	.strip:hover {
		text-decoration: none;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.callout {
		color: var(--text);
		font-size: 0.85rem;
		padding: 0.45rem 0.7rem;
	}
	.ring {
		width: 4.5rem;
		height: 4.5rem;
	}
	@media (max-width: 640px) {
		.strip {
			grid-template-columns: minmax(0, 1fr);
		}
		.ring {
			display: none;
		}
	}
</style>
