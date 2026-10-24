<script lang="ts">
	import { seasonsApi } from '$lib/api/seasons';
	import { CARRY_QUESTION, INTENTION_QUESTION, composeReflection, stallQuestion } from '$lib/seasons/reflection';
	import { formatRange } from '$lib/seasons/stats';
	import type { Season, SeasonDetails } from '$lib/types/api';

	// Ending a season is the one moment the app asks you to look back: the final
	// numbers beside the intention, then three short questions saved together as
	// the reflection. With a planned season ready, rotating ends this one and
	// starts that one in a single step.

	let {
		season,
		next,
		onended
	}: {
		season: SeasonDetails;
		/** The planned season to offer rotating into, if there is one. */
		next: Season | null;
		onended: (result: SeasonDetails) => void;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let answers = $state(['', '', '']);
	let rotate = $state(true);
	let saving = $state(false);
	let error = $state('');

	const questions = $derived([INTENTION_QUESTION, stallQuestion(season.Stats), CARRY_QUESTION]);
	const rotating = $derived(rotate && !!next);

	export function open() {
		answers = ['', '', ''];
		rotate = !!next;
		error = '';
		dialog?.showModal();
	}

	function close() {
		dialog?.close();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		error = '';
		const reflection =
			composeReflection(questions.map((question, i) => ({ question, answer: answers[i] }))) || undefined;
		try {
			const result =
				rotating && next
					? await seasonsApi.rotateTo(next.SeasonId, reflection)
					: await seasonsApi.end(season.SeasonId, reflection);
			close();
			onended(result);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to end the season.';
		} finally {
			saving = false;
		}
	}

	function onDialogClick(event: MouseEvent) {
		if (event.target === dialog && !saving) close();
	}
</script>

<dialog bind:this={dialog} onclick={onDialogClick} aria-labelledby="end-season-heading">
	<form class="panel" onsubmit={submit}>
		<span class="eyebrow">End season</span>
		<h2 id="end-season-heading">End “{season.Name}”?</h2>
		{#if season.Intention}
			<p class="intention">{season.Intention}</p>
		{/if}

		<div class="kpis">
			<div><b>{season.DaysElapsed} / {season.DaysPlanned}</b><span class="muted">Days run</span></div>
			<div><b>{season.Stats?.FocusShare ?? 0}%</b><span class="muted">Focus share</span></div>
			<div><b>{season.Stats?.ActiveDays ?? 0}</b><span class="muted">Active days</span></div>
		</div>

		<div class="look-back">
			<div class="row-between">
				<span class="eyebrow">Look back</span>
				<span class="muted">Optional · you can add it later</span>
			</div>
			{#each questions as question, i (i)}
				<div class="field">
					<label for="end-q{i}">{question}</label>
					<textarea id="end-q{i}" rows="2" bind:value={answers[i]}></textarea>
				</div>
			{/each}
		</div>

		{#if next}
			<div class="choice" role="radiogroup" aria-label="After ending">
				<label class:selected={rotate}>
					<input type="radio" name="end-next" value="rotate" checked={rotate} onchange={() => (rotate = true)} />
					<span><b>Rotate to {next.Name}</b><small>Planned {formatRange(next)}</small></span>
				</label>
				<label class:selected={!rotate}>
					<input type="radio" name="end-next" value="end" checked={!rotate} onchange={() => (rotate = false)} />
					<span><b>Just end it</b><small>No season will be active until you start one.</small></span>
				</label>
			</div>
		{/if}

		{#if error}
			<div class="error-banner">{error}</div>
		{/if}

		<div class="actions">
			<button type="button" onclick={close} disabled={saving}>Keep going</button>
			<button type="submit" class="primary" disabled={saving}>
				{saving ? 'Ending…' : rotating ? `Rotate to ${next?.Name}` : 'End season'}
			</button>
		</div>
	</form>
</dialog>

<style>
	dialog {
		width: min(38rem, calc(100vw - 2rem));
		max-height: calc(100vh - 2rem);
		padding: 0;
		background: var(--bg-elevated);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.55);
	}
	.panel {
		padding: 1.1rem 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.intention {
		margin: 0;
		font-size: 0.92rem;
		border-left: 2px solid var(--border);
		padding-left: 0.8rem;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.kpis div {
		display: flex;
		flex-direction: column;
	}
	.kpis b {
		font-size: 1.3rem;
		font-variant-numeric: tabular-nums;
	}
	.look-back {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-top: 1px solid var(--border);
		padding-top: 0.85rem;
	}
	.field {
		margin: 0;
	}
	.choice {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}
	.choice label {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.7rem;
		cursor: pointer;
		color: var(--text);
		font-size: 0.9rem;
	}
	.choice label.selected {
		border-color: var(--accent);
		background: var(--season-focus-soft);
	}
	.choice small {
		display: block;
		color: var(--text-muted);
		font-size: 0.8rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	@media (max-width: 560px) {
		.choice {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
