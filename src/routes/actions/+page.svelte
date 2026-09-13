<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { actionsApi } from '$lib/api/actions';
	import ActionTable, { type ActionRow } from '$lib/components/ActionTable.svelte';
	import type { KnowledgeNode, ActionItem } from '$lib/types/api';
	import { onMount } from 'svelte';

	let statusFilter = $state<'Open' | 'Completed'>('Open');
	let allActions = $state<ActionItem[]>([]);
	let nodesById = $state<Map<number, KnowledgeNode>>(new Map());
	let loading = $state(true);
	let error = $state('');

	// One flat list rather than a section per node — the Knowledge Node column
	// carries the grouping, and the table sorts on it like any other column.
	const rows = $derived.by((): ActionRow[] =>
		allActions
			.filter((action) => action.Status === statusFilter)
			.flatMap((action) => {
				const node = nodesById.get(action.KnowledgeNodeId);
				return node ? [{ ...action, KnowledgeNodeTitle: node.Title }] : [];
			})
	);

	async function load() {
		loading = true;
		error = '';
		try {
			const [nodes, openActions, completedActions] = await Promise.all([
				knowledgeNodesApi.getAll(),
				actionsApi.getAllOpen(),
				actionsApi.getAllCompleted()
			]);
			nodesById = new Map(nodes.map((node) => [node.Id, node]));
			allActions = [...openActions, ...completedActions];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load actions.';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="container wide">
	<div class="row-between">
		<h1>Actions</h1>
		<a href="/actions/new"><button class="primary">New action</button></a>
	</div>

	<div class="field" style="max-width: 200px;">
		<label for="status-filter">Status</label>
		<select id="status-filter" bind:value={statusFilter}>
			<option value="Open">Open</option>
			<option value="Completed">Closed</option>
		</select>
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if rows.length === 0}
		<div class="empty-state">No {statusFilter === 'Open' ? 'open' : 'closed'} actions.</div>
	{:else}
		<p class="muted count">
			{rows.length}
			{statusFilter === 'Open' ? 'open' : 'closed'}
			{rows.length === 1 ? 'action' : 'actions'}
		</p>
		<ActionTable actions={rows} showNode />
	{/if}
</div>

<style>
	.count {
		margin: 0 0 0.5rem;
	}
</style>
