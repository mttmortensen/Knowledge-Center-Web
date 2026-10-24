<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { seasonsApi } from '$lib/api/seasons';
	import { domainsApi } from '$lib/api/domains';
	import { auth } from '$lib/stores/auth.svelte';
	import { currentSeason } from '$lib/stores/season.svelte';
	import {
		MAX_FOCUS,
		expectedOverloadLevel,
		focusCount,
		toEditorLineup,
		toLineupInput,
		type LineupEntry,
		type LineupRole
	} from '$lib/seasons/lineup';
	import type { Domain, SeasonDetails } from '$lib/types/api';
	import FocusOverloadDialog from '$lib/components/seasons/FocusOverloadDialog.svelte';

	// Toggles only change the lineup on screen; Save sends the whole lineup in one
	// PUT, so a focus overload warning can only come back from Save.

	const seasonId = $derived(Number(page.params.id));
	const roles: LineupRole[] = ['Focus', 'Passive', 'Resting'];

	let season = $state<SeasonDetails | null>(null);
	let domains = $state<Domain[]>([]);
	let lineup = $state<Record<number, LineupEntry>>({});
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let overloadDialog = $state<FocusOverloadDialog>();

	const focus = $derived(focusCount(lineup));
	const level = $derived(expectedOverloadLevel(focus));

	async function load(id: number) {
		loading = true;
		error = '';
		try {
			const [s, ds] = await Promise.all([seasonsApi.getById(id), domainsApi.getAll()]);
			season = s;
			// Archived domains can't be added; ones already in the season stay listed.
			domains = ds.filter((d) => !d.IsArchived || s.Domains.some((m) => m.DomainId === d.DomainId));
			lineup = toEditorLineup(
				domains.map((d) => d.DomainId),
				s.Domains
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load the season.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load(seasonId);
	});

	function saved(updated: SeasonDetails) {
		if (updated.Status === 'Active') currentSeason.set(updated);
		goto(`/seasons/${seasonId}`);
	}

	async function save() {
		saving = true;
		error = '';
		const input = toLineupInput(lineup);
		try {
			const result = await seasonsApi.setDomains(seasonId, input);
			if ('saved' in result) saved(result.saved);
			else overloadDialog?.open(result.warning, input);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save the lineup.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container narrow">
	<div class="breadcrumb">
		<a href="/seasons">Seasons</a> /
		<a href="/seasons/{seasonId}">{season?.Name ?? '…'}</a> / Lineup
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading && !season}
		<p class="muted">Loading…</p>
	{:else if season}
		<div class="row-between heading">
			<h1>Lineup</h1>
			<div class="row">
				<span class="muted">Focus {focus} of {MAX_FOCUS}</span>
				<div class="slots" aria-hidden="true">
					{#each { length: Math.max(MAX_FOCUS, focus) } as _, i (i)}
						<span class="slot" class:on={i < focus && i < MAX_FOCUS} class:over={i < focus && i >= MAX_FOCUS}
						></span>
					{/each}
				</div>
			</div>
		</div>

		<div class="card">
			{#each domains as d (d.DomainId)}
				{@const entry = lineup[d.DomainId]}
				<div class="domain-row" class:archived={d.IsArchived}>
					<div class="name">
						<b>{d.DomainName}</b>
						{#if d.IsArchived}<span class="muted">Archived, can only be removed</span>{/if}
						{#if entry.role !== 'Resting'}
							<input
								id="note-{d.DomainId}"
								class="note"
								type="text"
								maxlength="300"
								placeholder="Note (optional), e.g. Covered at work"
								aria-label="Note for {d.DomainName}"
								bind:value={entry.note}
							/>
						{/if}
					</div>
					<div class="seg" role="group" aria-label="Role for {d.DomainName}">
						{#each roles as role (role)}
							<button
								type="button"
								class="r-{role.toLowerCase()}"
								aria-pressed={entry.role === role}
								disabled={d.IsArchived && role !== 'Resting'}
								onclick={() => (entry.role = role)}>{role}</button
							>
						{/each}
					</div>
				</div>
			{/each}

			<div class="footer">
				<span class="muted">
					{#if focus === 0}
						A season needs at least one Focus domain before it can start.
					{:else if level > 0}
						More than {MAX_FOCUS} Focus domains brings up a warning you'll have to confirm.
					{:else}
						Passive domains stay in the season but don't count toward the Focus limit.
					{/if}
				</span>
				<div class="row">
					<a href="/seasons/{seasonId}"><button type="button">Cancel</button></a>
					<button
						type="button"
						class={level > 0 ? 'danger' : 'primary'}
						onclick={save}
						disabled={saving || auth.isDemo}
					>
						{saving ? 'Saving…' : 'Save lineup'}
					</button>
				</div>
			</div>
		</div>
		{#if auth.isDemo}
			<p class="muted">Changing the lineup is disabled in demo mode.</p>
		{/if}

		<FocusOverloadDialog bind:this={overloadDialog} {seasonId} onsaved={saved} />
	{/if}
</div>

<style>
	.narrow {
		max-width: 760px;
	}
	.heading {
		margin-bottom: 1rem;
	}
	h1 {
		margin: 0;
	}
	.slots {
		display: flex;
		gap: 0.3rem;
	}
	.slot {
		width: 1.6rem;
		height: 0.55rem;
		border-radius: 3px;
		border: 1px solid var(--season-focus);
	}
	.slot.on {
		background: var(--season-focus);
	}
	.slot.over {
		border-color: var(--danger);
		background: var(--danger);
	}
	.domain-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.65rem 0;
		border-top: 1px solid var(--border);
	}
	.domain-row:first-child {
		border-top: 0;
	}
	.domain-row.archived {
		opacity: 0.6;
	}
	.name {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}
	.note {
		font-size: 0.85rem;
		padding: 0.3rem 0.55rem;
	}
	.seg {
		display: inline-flex;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.seg button {
		border: 0;
		border-radius: 0;
		padding: 0.35rem 0.75rem;
		font-size: 0.85rem;
		background: transparent;
		color: var(--text-muted);
	}
	.seg button + button {
		border-left: 1px solid var(--border);
	}
	.seg button[aria-pressed='true'].r-focus {
		background: var(--season-focus-soft);
		color: var(--season-focus);
		font-weight: 600;
	}
	.seg button[aria-pressed='true'].r-passive {
		background: var(--season-passive-soft);
		color: var(--season-passive);
		font-weight: 600;
	}
	.seg button[aria-pressed='true'].r-resting {
		background: var(--bg-hover);
		color: var(--text);
	}
	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		border-top: 1px solid var(--border);
		padding-top: 0.8rem;
		margin-top: 0.2rem;
	}
	@media (max-width: 560px) {
		.domain-row {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
