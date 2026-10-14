<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { DemoForbiddenError } from '$lib/api/client';

	// Reviews a node's promotion to a domain. The domain starts out named after
	// the node, and since a domain needs a knowledge node, the node itself stays
	// on under the new domain — renamed to the knowledge node name asked for
	// here — carrying its logs and actions with it.

	let {
		nodeId,
		nodeTitle,
		logCount,
		actionCount
	}: {
		nodeId: number;
		nodeTitle: string;
		logCount: number;
		actionCount: number;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let knInput = $state<HTMLInputElement>();
	let domainName = $state('');
	let knName = $state('');
	let promoting = $state(false);
	let error = $state('');

	export async function open() {
		domainName = nodeTitle;
		knName = '';
		error = '';
		dialog?.showModal();
		await tick();
		knInput?.focus();
	}

	function close() {
		dialog?.close();
	}

	async function promote(event: SubmitEvent) {
		event.preventDefault();
		if (!domainName.trim()) {
			error = 'Give the domain a name.';
			return;
		}
		if (!knName.trim()) {
			error = 'Name the knowledge node that will hold the logs and actions.';
			knInput?.focus();
			return;
		}
		promoting = true;
		error = '';
		try {
			const newDomain = await knowledgeNodesApi.promote(nodeId, {
				DomainName: domainName.trim(),
				KnowledgeNodeTitle: knName.trim()
			});
			close();
			goto(`/domains/${newDomain.DomainId}`);
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to promote knowledge node.';
		} finally {
			promoting = false;
		}
	}

	// Clicking the backdrop (the dialog element itself, outside the panel) closes it.
	function onDialogClick(event: MouseEvent) {
		if (event.target === dialog && !promoting) close();
	}
</script>

<dialog bind:this={dialog} onclick={onDialogClick} aria-labelledby="promote-dialog-heading">
	<form class="panel" onsubmit={promote}>
		<h2 id="promote-dialog-heading">Promote to domain</h2>
		<p class="intro">
			A new domain is created from <strong>{nodeTitle}</strong>. Its {logCount}
			{logCount === 1 ? 'log entry' : 'log entries'} and {actionCount}
			{actionCount === 1 ? 'action' : 'actions'} move to a knowledge node inside it.
		</p>

		{#if error}
			<div class="error-banner">{error}</div>
		{/if}

		<div class="field">
			<label for="promote-domain-name">Domain name</label>
			<input id="promote-domain-name" type="text" maxlength="100" required bind:value={domainName} />
		</div>

		<div class="field">
			<label for="promote-kn-name">Knowledge node</label>
			<input
				id="promote-kn-name"
				type="text"
				maxlength="100"
				required
				placeholder="e.g. Fundamentals"
				bind:this={knInput}
				bind:value={knName}
			/>
			<p class="hint">The first knowledge node in the new domain. The logs and actions move here.</p>
		</div>

		<div class="actions">
			<button type="button" onclick={close} disabled={promoting}>Cancel</button>
			<button type="submit" class="primary" disabled={promoting}>
				{promoting ? 'Promoting…' : 'Promote'}
			</button>
		</div>
	</form>
</dialog>

<style>
	dialog {
		width: min(32rem, calc(100vw - 2rem));
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
	}
	h2 {
		margin: 0 0 0.6rem;
		font-size: 1.1rem;
	}
	.intro {
		margin: 0 0 0.9rem;
		font-size: 0.9rem;
		color: var(--text-muted);
	}
	.hint {
		margin: 0.3rem 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}
</style>
