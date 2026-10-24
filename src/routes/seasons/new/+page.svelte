<script lang="ts">
	import { goto } from '$app/navigation';
	import { seasonsApi } from '$lib/api/seasons';
	import { auth } from '$lib/stores/auth.svelte';

	function isoDay(date: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	}

	const today = new Date();
	let name = $state('');
	let intention = $state('');
	let plannedStart = $state(isoDay(today));
	let plannedEnd = $state(isoDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60)));
	let saving = $state(false);
	let error = $state('');

	async function create(event: SubmitEvent) {
		event.preventDefault();
		if (plannedEnd <= plannedStart) {
			error = 'The planned end has to be after the start.';
			return;
		}
		saving = true;
		error = '';
		try {
			const season = await seasonsApi.create({
				Name: name.trim(),
				Intention: intention.trim() || undefined,
				PlannedStart: plannedStart,
				PlannedEnd: plannedEnd
			});
			goto(`/seasons/${season.SeasonId}/lineup`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create the season.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container narrow">
	<div class="breadcrumb"><a href="/seasons">Seasons</a> / New</div>
	<h1>Plan a season</h1>
	<p class="muted intro">
		Name it and say what you want out of it. You'll pick the Focus and Passive domains next.
	</p>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<form class="card" onsubmit={create}>
		<div class="field">
			<label for="season-name">Name</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="season-name"
				type="text"
				maxlength="100"
				required
				autofocus
				placeholder="e.g. Winter: Machine Learning deep dive"
				bind:value={name}
			/>
		</div>
		<div class="field">
			<label for="season-intention">Intention <span class="muted">(optional)</span></label>
			<textarea
				id="season-intention"
				rows="3"
				placeholder="What would make this season feel worth it?"
				bind:value={intention}
			></textarea>
		</div>
		<div class="dates">
			<div class="field">
				<label for="season-start">Planned start</label>
				<input id="season-start" type="date" required bind:value={plannedStart} />
			</div>
			<div class="field">
				<label for="season-end">Planned end</label>
				<input id="season-end" type="date" required bind:value={plannedEnd} />
			</div>
		</div>
		<p class="muted">A season only ends when you end it; the planned end is a target.</p>
		<div class="row">
			<button class="primary" type="submit" disabled={saving || auth.isDemo || !name.trim()}>
				{saving ? 'Creating…' : 'Next: choose domains'}
			</button>
			<a href="/seasons"><button type="button">Cancel</button></a>
		</div>
		{#if auth.isDemo}
			<p class="muted">Planning seasons is disabled in demo mode.</p>
		{/if}
	</form>
</div>

<style>
	.narrow {
		max-width: 640px;
	}
	.intro {
		margin: 0 0 1rem;
	}
	.dates {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	@media (max-width: 480px) {
		.dates {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
