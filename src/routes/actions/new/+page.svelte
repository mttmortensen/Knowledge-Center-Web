<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { actionsApi } from '$lib/api/actions';
	import type { KnowledgeNode } from '$lib/types/api';

	let nodes = $state<KnowledgeNode[]>([]);
	let loadingNodes = $state(true);

	let nodeId = $state<number | ''>('');
	let actionText = $state('');
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
		if (!actionText.trim()) {
			error = 'Action text cannot be empty.';
			return;
		}
		saving = true;
		error = '';
		try {
			await actionsApi.create({ KnowledgeNodeId: nodeId, ActionText: actionText });
			goto(`/nodes/${nodeId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create action.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href="/actions">Back to actions</a></div>
	<h1>New Action</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loadingNodes}
		<p class="muted">Loading…</p>
	{:else if nodes.length === 0}
		<div class="empty-state">No knowledge nodes yet. Create one before adding an action.</div>
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
				<label for="action-text">Action</label>
				<textarea id="action-text" rows="3" bind:value={actionText} required></textarea>
			</div>

			<button type="submit" class="primary" disabled={saving}>
				{saving ? 'Saving…' : 'Create action'}
			</button>
		</form>
	{/if}
</div>
