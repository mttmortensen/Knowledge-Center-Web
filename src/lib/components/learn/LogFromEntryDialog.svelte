<script lang="ts">
	import { tick } from 'svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { renderMarkdown } from '$lib/learn/render';
	import type { KnowledgeNode, LogEntry } from '$lib/types/api';

	// Turns one Learn entry into a Log under a knowledge node. The entry's
	// markdown (minus its ?? / @answers marker) becomes the log content as-is;
	// the dialog only asks for a title and tags. A session already linked to a
	// node files the log there; otherwise a node has to be picked here.

	let {
		nodeId,
		nodeTitle,
		oncreated
	}: {
		nodeId: number | null;
		nodeTitle: string | null;
		oncreated: (entryId: number, log: LogEntry) => void;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let titleInput = $state<HTMLInputElement>();
	let entryId = $state(0);
	let content = $state('');
	let title = $state('');
	let tagIds = $state<number[]>([]);
	let pickedNodeId = $state('0');
	let nodes = $state<KnowledgeNode[]>([]);
	let saving = $state(false);
	let error = $state('');

	const targetNodeId = $derived(nodeId ?? Number(pickedNodeId));

	export async function open(id: number, body: string) {
		entryId = id;
		content = body;
		title = '';
		tagIds = [];
		pickedNodeId = '0';
		error = '';
		dialog?.showModal();
		await tick();
		titleInput?.focus();

		if (nodeId === null && nodes.length === 0) {
			try {
				nodes = (await knowledgeNodesApi.getAll())
					.filter((n) => !n.IsArchived)
					.sort((a, b) => a.Title.localeCompare(b.Title));
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to load knowledge nodes.';
			}
		}
	}

	function close() {
		dialog?.close();
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) {
			error = 'Give the log a title.';
			titleInput?.focus();
			return;
		}
		if (!targetNodeId) {
			error = 'Pick a knowledge node to file the log under.';
			return;
		}
		saving = true;
		error = '';
		try {
			const log = await logEntriesApi.create({
				NodeId: targetNodeId,
				Title: title.trim(),
				Content: content,
				TagIds: tagIds
			});
			oncreated(entryId, log);
			close();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create log entry.';
		} finally {
			saving = false;
		}
	}

	// Clicking the backdrop (the dialog element itself, outside the panel) closes it.
	function onDialogClick(event: MouseEvent) {
		if (event.target === dialog && !saving) close();
	}
</script>

<dialog bind:this={dialog} onclick={onDialogClick} aria-labelledby="log-dialog-heading">
	<form class="panel" onsubmit={save}>
		<h2 id="log-dialog-heading">Save entry #{entryId} as a log</h2>

		{#if error}
			<div class="error-banner">{error}</div>
		{/if}

		<div class="field">
			<label for="log-title">Title</label>
			<input id="log-title" type="text" maxlength="200" bind:this={titleInput} bind:value={title} />
		</div>

		<div class="field">
			<span class="label">Knowledge node</span>
			{#if nodeId !== null}
				<a class="node" href="/nodes/{nodeId}" target="_blank" rel="noopener">{nodeTitle ?? `Node ${nodeId}`}</a>
			{:else}
				<select aria-label="Knowledge node" bind:value={pickedNodeId}>
					<option value="0">Pick a knowledge node…</option>
					{#each nodes as node (node.Id)}
						<option value={String(node.Id)}>{node.Title}</option>
					{/each}
				</select>
				<p class="hint">This session isn't linked to a knowledge node, so pick one for the log.</p>
			{/if}
		</div>

		<div class="field">
			<span class="label">Tags</span>
			{#key entryId}
				<TagPicker bind:selectedIds={tagIds} />
			{/key}
		</div>

		<div class="field">
			<span class="label">Content</span>
			<div class="preview">{@html renderMarkdown(content)}</div>
		</div>

		<div class="actions">
			<button type="button" onclick={close} disabled={saving}>Cancel</button>
			<button type="submit" class="primary" disabled={saving}>
				{saving ? 'Saving…' : 'Create log'}
			</button>
		</div>
	</form>
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
	}
	h2 {
		margin: 0 0 0.9rem;
		font-size: 1.1rem;
	}
	.label {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.node {
		font-weight: 600;
	}
	.hint {
		margin: 0.3rem 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.preview {
		max-height: 12rem;
		overflow: auto;
		padding: 0.5rem 0.7rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.85rem;
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
	.preview :global(> :first-child) {
		margin-top: 0;
	}
	.preview :global(> :last-child) {
		margin-bottom: 0;
	}
	.preview :global(img) {
		max-width: 100%;
		max-height: 8rem;
	}
	.preview :global(pre) {
		overflow-x: auto;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}
</style>
