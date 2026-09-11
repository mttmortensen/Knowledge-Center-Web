<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { uploadImage } from '$lib/api/images';
	import type { KnowledgeNode } from '$lib/types/api';

	let nodes = $state<KnowledgeNode[]>([]);
	let loadingNodes = $state(true);

	let nodeId = $state<number | ''>('');
	let title = $state('');
	let content = $state('');
	let chatUrl = $state('');
	let tagIds = $state<number[]>([]);
	let saving = $state(false);
	let error = $state('');

	async function loadNodes() {
		loadingNodes = true;
		try {
			nodes = [...(await knowledgeNodesApi.getAll())].sort((a, b) =>
				a.Title.localeCompare(b.Title)
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load knowledge nodes.';
		} finally {
			loadingNodes = false;
		}
	}

	onMount(loadNodes);

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!nodeId) {
			error = 'Please select a knowledge node.';
			return;
		}
		if (!content.trim()) {
			error = 'Entry content cannot be empty.';
			return;
		}
		saving = true;
		error = '';
		try {
			await logEntriesApi.create({
				NodeId: nodeId,
				Title: title || undefined,
				Content: content,
				TagIds: tagIds,
				ChatURL: chatUrl || undefined
			});
			goto(`/nodes/${nodeId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create log entry.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href="/logs">Back to logs</a></div>
	<h1>New Log Entry</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loadingNodes}
		<p class="muted">Loading…</p>
	{:else if nodes.length === 0}
		<div class="empty-state">No knowledge nodes yet. Create one before adding a log entry.</div>
	{:else}
		<form onsubmit={save}>
			<div class="field">
				<label for="node">Knowledge Node</label>
				<select id="node" bind:value={nodeId} required>
					<option value="" disabled>Select a node…</option>
					{#each nodes as node (node.Id)}
						<option value={node.Id}>{node.Title}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="title">Title (optional)</label>
				<input id="title" type="text" bind:value={title} />
			</div>

			<div class="field">
				<label for="content">Content</label>
				<TiptapEditor bind:value={content} onImageUpload={uploadImage} />
			</div>

			<div class="field">
				<label for="tags">Tags</label>
				<TagPicker bind:selectedIds={tagIds} />
			</div>

			<div class="field">
				<label for="chat-url">Chat URL (optional)</label>
				<input id="chat-url" type="url" bind:value={chatUrl} placeholder="https://..." />
			</div>

			<button type="submit" class="primary" disabled={saving}>
				{saving ? 'Saving…' : 'Create entry'}
			</button>
		</form>
	{/if}
</div>
