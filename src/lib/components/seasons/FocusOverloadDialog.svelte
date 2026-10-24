<script lang="ts">
	import { tick } from 'svelte';
	import { seasonsApi } from '$lib/api/seasons';
	import { phraseMatches } from '$lib/seasons/lineup';
	import type { SeasonDetails, SeasonDomainInput, SeasonOverloadWarning } from '$lib/types/api';

	// Shown when saving a lineup comes back with a FocusOverload warning. Everything
	// it says comes from the warning; it asks only for what Requires lists (a typed
	// phrase, a reason, a wait), then resends the same lineup with the ack. The
	// primary action is backing out to move some domains to Passive.

	let {
		seasonId,
		onsaved
	}: { seasonId: number; onsaved: (season: SeasonDetails) => void } = $props();

	let dialog = $state<HTMLDialogElement>();
	let warning = $state<SeasonOverloadWarning | null>(null);
	let lineup: SeasonDomainInput[] = [];
	let phrase = $state('');
	let reason = $state('');
	let waitLeft = $state(0);
	let saving = $state(false);
	let error = $state('');
	let timer: ReturnType<typeof setInterval> | undefined;

	const requires = $derived(warning?.Requires);
	const reasonLength = $derived(reason.trim().length);
	const ready = $derived(
		!!requires &&
			(!requires.Phrase || phraseMatches(phrase, requires.Phrase)) &&
			reasonLength >= requires.ReasonMinLength &&
			waitLeft === 0
	);

	export async function open(next: SeasonOverloadWarning, pendingLineup: SeasonDomainInput[]) {
		lineup = pendingLineup;
		phrase = '';
		reason = '';
		error = '';
		show(next);
		dialog?.showModal();
		await tick();
		dialog?.querySelector<HTMLElement>('.primary')?.focus();
	}

	function show(next: SeasonOverloadWarning) {
		warning = next;
		startWait(next.Requires.WaitRemainingSeconds);
	}

	function startWait(seconds: number) {
		clearInterval(timer);
		waitLeft = seconds;
		if (seconds <= 0) return;
		timer = setInterval(() => {
			waitLeft = Math.max(0, waitLeft - 1);
			if (waitLeft === 0) clearInterval(timer);
		}, 1000);
	}

	function close() {
		clearInterval(timer);
		dialog?.close();
	}

	async function confirm() {
		if (!warning || !ready) return;
		saving = true;
		error = '';
		try {
			const result = await seasonsApi.setDomains(seasonId, lineup, {
				ChallengeToken: warning.ChallengeToken,
				Phrase: requires?.Phrase ? phrase : undefined,
				Reason: requires?.ReasonMinLength ? reason : undefined
			});
			if ('saved' in result) {
				close();
				onsaved(result.saved);
			} else {
				// A fresh challenge, with AckError saying what didn't pass. Keep what was typed.
				show(result.warning);
				error = result.warning.AckError ?? '';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save the lineup.';
		} finally {
			saving = false;
		}
	}

	function onDialogClick(event: MouseEvent) {
		if (event.target === dialog && !saving) close();
	}
</script>

<dialog bind:this={dialog} onclick={onDialogClick} onclose={() => clearInterval(timer)} aria-labelledby="overload-heading">
	{#if warning && requires}
		<div class="panel" data-level={warning.Level}>
			<span class="level">Focus overload · level {warning.Level}</span>
			<h2 id="overload-heading">{warning.Title}</h2>
			<div class="chips">
				{#each warning.FocusDomains as name (name)}
					<span class="role-pill focus">{name}</span>
				{/each}
			</div>
			<p>{warning.Message}</p>
			<ul>
				{#each warning.Consequences as c (c)}
					<li>{c}</li>
				{/each}
			</ul>
			<div class="suggest"><strong>Suggestion</strong> {warning.Suggestion}</div>

			{#if error}
				<div class="error-banner">{error}</div>
			{/if}

			{#if requires.Phrase}
				<div class="field">
					<label for="overload-phrase">Type this to confirm</label>
					<div class="phrase">{requires.Phrase}</div>
					<input id="overload-phrase" type="text" autocomplete="off" bind:value={phrase} />
				</div>
			{/if}

			{#if requires.ReasonMinLength > 0}
				<div class="field">
					<label for="overload-reason">{requires.ReasonPrompt}</label>
					<textarea id="overload-reason" rows="4" bind:value={reason}></textarea>
					<div class="counter" class:ok={reasonLength >= requires.ReasonMinLength}>
						{reasonLength} / {requires.ReasonMinLength}
					</div>
				</div>
			{/if}

			<div class="actions">
				{#if requires.WaitSeconds > 0}
					<span class="wait">
						{waitLeft > 0 ? `Available in 0:${String(waitLeft).padStart(2, '0')}` : 'Wait complete'}
					</span>
				{/if}
				<button type="button" class="danger" onclick={confirm} disabled={!ready || saving}>
					{saving ? 'Saving…' : requires.ConfirmLabel}
				</button>
				<button type="button" class="primary" onclick={close} disabled={saving}>
					Move some to Passive
				</button>
			</div>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: min(36rem, calc(100vw - 2rem));
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
		gap: 0.8rem;
	}
	.level {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--danger);
	}
	.panel[data-level='1'] .level {
		color: var(--warning);
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	p {
		margin: 0;
		font-size: 0.92rem;
	}
	ul {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.9rem;
		color: var(--text-muted);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.suggest {
		font-size: 0.88rem;
		background: var(--season-passive-soft);
		border-radius: var(--radius);
		padding: 0.65rem 0.8rem;
	}
	.suggest strong {
		color: var(--season-passive);
	}
	.field {
		margin: 0;
	}
	.phrase {
		font-family: ui-monospace, Consolas, monospace;
		font-size: 0.85rem;
		border: 1px dashed var(--border);
		border-radius: 6px;
		padding: 0.5rem 0.65rem;
		margin-bottom: 0.4rem;
		user-select: none;
	}
	.counter {
		font-size: 0.78rem;
		color: var(--text-muted);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.counter.ok {
		color: var(--success);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}
	.wait {
		font-family: ui-monospace, Consolas, monospace;
		font-size: 0.82rem;
		color: var(--warning);
		margin-right: auto;
	}
</style>
