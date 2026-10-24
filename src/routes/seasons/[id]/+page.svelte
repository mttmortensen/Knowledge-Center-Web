<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { seasonsApi } from '$lib/api/seasons';
	import { domainsApi } from '$lib/api/domains';
	import { auth } from '$lib/stores/auth.svelte';
	import { currentSeason } from '$lib/stores/season.svelte';
	import { formatRange, progressPercent } from '$lib/seasons/stats';
	import { renderMarkdown } from '$lib/learn/render';
	import type { Domain, Season, SeasonDetails } from '$lib/types/api';
	import SeasonLineup from '$lib/components/seasons/SeasonLineup.svelte';
	import SeasonStats from '$lib/components/seasons/SeasonStats.svelte';
	import EndSeasonDialog from '$lib/components/seasons/EndSeasonDialog.svelte';

	const seasonId = $derived(Number(page.params.id));

	let season = $state<SeasonDetails | null>(null);
	let domains = $state<Domain[]>([]);
	let nextPlanned = $state<Season | null>(null);
	let loading = $state(true);
	let error = $state('');
	let busy = $state(false);
	let endDialog = $state<EndSeasonDialog>();

	let editing = $state(false);
	let editName = $state('');
	let editIntention = $state('');
	let editStart = $state('');
	let editEnd = $state('');
	let editingReflection = $state(false);
	let editReflection = $state('');

	async function load(id: number) {
		loading = true;
		error = '';
		try {
			const [s, ds, planned] = await Promise.all([
				seasonsApi.getById(id),
				domainsApi.getAll(),
				seasonsApi.getAll('Planned')
			]);
			season = s;
			domains = ds;
			// The earliest planned season is the one a rotate would start.
			nextPlanned = [...planned].sort((a, b) => a.PlannedStart.localeCompare(b.PlannedStart))[0] ?? null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load the season.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load(seasonId);
	});

	function apply(updated: SeasonDetails) {
		season = updated;
		if (updated.Status === 'Active') currentSeason.set(updated);
	}

	async function run(action: () => Promise<SeasonDetails>, failure: string) {
		busy = true;
		error = '';
		try {
			apply(await action());
		} catch (err) {
			error = err instanceof Error ? err.message : failure;
		} finally {
			busy = false;
		}
	}

	function startEditing() {
		if (!season) return;
		editName = season.Name;
		editIntention = season.Intention ?? '';
		editStart = season.PlannedStart;
		editEnd = season.PlannedEnd;
		editing = true;
	}

	async function saveDetails(event: SubmitEvent) {
		event.preventDefault();
		if (!season) return;
		const ended = season.Status === 'Ended';
		await run(
			() =>
				seasonsApi.update(seasonId, {
					Name: editName.trim(),
					Intention: editIntention.trim(),
					...(ended ? {} : { PlannedStart: editStart, PlannedEnd: editEnd })
				}),
			'Failed to save the season.'
		);
		if (!error) editing = false;
	}

	async function saveReflection(event: SubmitEvent) {
		event.preventDefault();
		await run(() => seasonsApi.update(seasonId, { Reflection: editReflection.trim() }), 'Failed to save the reflection.');
		if (!error) editingReflection = false;
	}

	async function deleteSeason() {
		if (!season || !confirm(`Delete "${season.Name}"? Its domains aren't affected.`)) return;
		busy = true;
		try {
			await seasonsApi.delete(seasonId);
			if (season.Status === 'Active') currentSeason.set(null);
			goto('/seasons');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete the season.';
			busy = false;
		}
	}

	function onEnded(result: SeasonDetails) {
		// A rotate returns the newly started season; a plain end returns this one, ended.
		currentSeason.set(result.Status === 'Active' ? result : null);
		if (result.SeasonId !== seasonId) goto(`/seasons/${result.SeasonId}`);
		else season = result;
	}
</script>

<div class="container wide">
	<div class="breadcrumb"><a href="/seasons">Seasons</a> / {season?.Name ?? '…'}</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading && !season}
		<p class="muted">Loading…</p>
	{:else if season}
		<div class="hero">
			<div class="card head">
				<div class="row-between">
					<div class="row">
						{#if season.Status === 'Active' && season.IsOverdue}
							<span class="tag-pill archived">Past planned end</span>
						{:else}
							<span class="tag-pill status {season.Status.toLowerCase()}">{season.Status}</span>
						{/if}
						<span class="muted">{formatRange(season)} · {season.DaysPlanned} days</span>
					</div>
					<div class="row">
						<button class="small" onclick={startEditing} disabled={auth.isDemo || busy}>Edit</button>
						{#if season.Status === 'Planned'}
							<button
								class="small primary"
								onclick={() => run(() => seasonsApi.start(seasonId), 'Failed to start the season.')}
								disabled={auth.isDemo || busy || season.FocusCount === 0}
								title={season.FocusCount === 0 ? 'Add a Focus domain before starting' : undefined}
							>
								Start season
							</button>
						{:else if season.Status === 'Active'}
							<button class="small" onclick={() => endDialog?.open()} disabled={auth.isDemo || busy}>
								End season
							</button>
						{/if}
					</div>
				</div>

				{#if editing}
					<form class="edit" onsubmit={saveDetails}>
						<div class="field">
							<label for="edit-name">Name</label>
							<input id="edit-name" type="text" maxlength="100" required bind:value={editName} />
						</div>
						<div class="field">
							<label for="edit-intention">Intention</label>
							<textarea id="edit-intention" rows="2" bind:value={editIntention}></textarea>
						</div>
						{#if season.Status !== 'Ended'}
							<div class="dates">
								<div class="field">
									<label for="edit-start">Planned start</label>
									<input id="edit-start" type="date" required bind:value={editStart} />
								</div>
								<div class="field">
									<label for="edit-end">Planned end</label>
									<input id="edit-end" type="date" required bind:value={editEnd} />
								</div>
							</div>
						{/if}
						<div class="row">
							<button type="submit" class="primary" disabled={busy}>Save</button>
							<button type="button" onclick={() => (editing = false)}>Cancel</button>
							<button type="button" class="danger push" onclick={deleteSeason} disabled={busy}>
								Delete season
							</button>
						</div>
					</form>
				{:else}
					<h1>{season.Name}</h1>
					{#if season.Status === 'Ended'}
						<div class="two">
							<div>
								<span class="label">Intention</span>
								<p class="intention">{season.Intention || 'No intention was written.'}</p>
							</div>
							<div>
								<div class="row-between">
									<span class="label">Reflection</span>
									{#if !editingReflection}
										<button
											class="link"
											onclick={() => {
												editReflection = season?.Reflection ?? '';
												editingReflection = true;
											}}
											disabled={auth.isDemo}>{season.Reflection ? 'Edit' : 'Add one'}</button
										>
									{/if}
								</div>
								{#if editingReflection}
									<form onsubmit={saveReflection}>
										<textarea rows="6" bind:value={editReflection} aria-label="Reflection"></textarea>
										<div class="row">
											<button type="submit" class="primary" disabled={busy}>Save</button>
											<button type="button" onclick={() => (editingReflection = false)}>Cancel</button>
										</div>
									</form>
								{:else if season.Reflection}
									<!-- renderMarkdown escapes raw HTML, so this is safe to inject. -->
									<div class="intention reflection">{@html renderMarkdown(season.Reflection)}</div>
								{:else}
									<p class="intention muted">No reflection yet.</p>
								{/if}
							</div>
						</div>
					{:else if season.Intention}
						<p class="intention">{season.Intention}</p>
					{/if}

					{#if season.Status === 'Active'}
						<div class="progress-wrap">
							<div class="season-progress"><span style:width="{progressPercent(season)}%"></span></div>
							<div class="row-between muted">
								<span>Day {season.DaysElapsed} of {season.DaysPlanned}</span>
								<span>
									{season.IsOverdue ? 'Past the planned end' : `${season.DaysRemaining} days left`} · ends
									when you end it
								</span>
							</div>
						</div>
					{/if}
					{#if season.OverloadReason}
						<div class="callout">
							<strong>{season.FocusCount} focus</strong>
							<span>Why: {season.OverloadReason}</span>
						</div>
					{/if}
				{/if}
			</div>

			<div class="card">
				<SeasonLineup
					members={season.Domains}
					allDomains={domains}
					editHref={season.Status === 'Ended' ? undefined : `/seasons/${seasonId}/lineup`}
					canEdit={!auth.isDemo}
				/>
			</div>
		</div>

		{#if season.Stats && season.DaysElapsed != null}
			<SeasonStats stats={season.Stats} daysElapsed={season.DaysElapsed} />
		{:else}
			<div class="card empty-state">
				Stats start when the season does.
				{#if season.FocusCount === 0}Add at least one Focus domain to be able to start it.{/if}
			</div>
		{/if}

		{#if auth.isDemo}
			<p class="muted">Editing, starting and ending seasons are disabled in demo mode.</p>
		{/if}

		{#if season.Status === 'Active'}
			<EndSeasonDialog bind:this={endDialog} {season} next={nextPlanned} onended={onEnded} />
		{/if}
	{/if}
</div>

<style>
	.wide {
		max-width: 1100px;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.hero .card {
		margin-bottom: 0;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.intention {
		margin: 0.3rem 0 0;
		border-left: 2px solid var(--border);
		padding-left: 0.8rem;
		max-width: 62ch;
	}
	.reflection {
		border-color: var(--accent);
	}
	.reflection :global(p) {
		margin: 0 0 0.5rem;
	}
	.label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.two {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	.progress-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.status.active {
		color: var(--success);
		border-color: var(--success);
	}
	.status.planned {
		border-style: dashed;
	}
	.edit .dates {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.push {
		margin-left: auto;
	}
	button.small {
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
	}
	button.link {
		background: none;
		border: 0;
		padding: 0;
		color: var(--accent);
		font-size: 0.85rem;
	}
	@media (max-width: 760px) {
		.hero,
		.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
