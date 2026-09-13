<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { actionsApi } from '$lib/api/actions';
	import ActionTable from '$lib/components/ActionTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { ANY, matchesQuery, matchesSelect, type FilterSelect } from '$lib/utils/tableFilter';
	import type { KnowledgeNode, ActionItem } from '$lib/types/api';
	import { onMount } from 'svelte';

	type NodeGroup = { node: KnowledgeNode; actions: ActionItem[] };

	let allActions = $state<ActionItem[]>([]);
	let nodesById = $state<Map<number, KnowledgeNode>>(new Map());
	let loading = $state(true);
	let error = $state('');

	let search = $state('');
	// Open-only is the landing view; "All statuses" is a deliberate choice here.
	let filters = $state<Record<string, string>>({ node: ANY, status: 'Open' });

	/** Actions whose node is gone are dropped everywhere, filters included. */
	const knownActions = $derived(
		allActions.filter((action) => nodesById.has(action.KnowledgeNodeId))
	);

	const filterSelects = $derived.by((): FilterSelect[] => {
		const nodeIds = new Set(knownActions.map((action) => action.KnowledgeNodeId));
		return [
			{
				key: 'node',
				label: 'Knowledge node',
				allLabel: 'All knowledge nodes',
				options: [...nodeIds]
					.map((nodeId) => nodesById.get(nodeId)!)
					.sort((a, b) => a.Title.localeCompare(b.Title))
					.map((node) => ({ value: String(node.Id), label: node.Title }))
			},
			{
				key: 'status',
				label: 'Status',
				allLabel: 'All statuses',
				options: [
					{ value: 'Open', label: 'Open' },
					{ value: 'Completed', label: 'Closed' }
				]
			}
		];
	});

	const visibleActions = $derived(
		knownActions.filter(
			(action) =>
				matchesQuery(
					search,
					action.ActionText,
					nodesById.get(action.KnowledgeNodeId)?.Title
				) &&
				matchesSelect(filters.node, action.KnowledgeNodeId) &&
				matchesSelect(filters.status, action.Status)
		)
	);

	const groups = $derived.by((): NodeGroup[] => {
		const byNode = new Map<number, ActionItem[]>();
		for (const action of visibleActions) {
			if (!byNode.has(action.KnowledgeNodeId)) byNode.set(action.KnowledgeNodeId, []);
			byNode.get(action.KnowledgeNodeId)!.push(action);
		}
		// Row order within a group is the table's job — each ActionTable keeps its
		// own sort, so groups sort independently.
		return [...byNode.entries()]
			.map(([nodeId, nodeActions]) => ({ node: nodesById.get(nodeId)!, actions: nodeActions }))
			.sort((a, b) => a.node.Title.localeCompare(b.node.Title));
	});

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

	let collapsed = $state<Record<number, boolean>>({});
	function toggleGroup(nodeId: number) {
		collapsed[nodeId] = !collapsed[nodeId];
	}
</script>

<div class="container">
	<div class="row-between">
		<h1>Actions</h1>
		<a href="/actions/new"><button class="primary">New action</button></a>
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if knownActions.length === 0}
		<div class="empty-state">No actions yet.</div>
	{:else}
		<FilterBar
			bind:search
			bind:values={filters}
			selects={filterSelects}
			placeholder="Search action text…"
			searchLabel="Search actions"
			shown={visibleActions.length}
			total={knownActions.length}
			itemLabel="actions"
		/>
		{#if groups.length === 0}
			<div class="empty-state">No actions match these filters.</div>
		{:else}
			{#each groups as group (group.node.Id)}
				<section class="group">
					<div class="group-header-row">
						<button
							type="button"
							class="chevron-btn"
							onclick={() => toggleGroup(group.node.Id)}
							aria-expanded={!collapsed[group.node.Id]}
							aria-label={collapsed[group.node.Id] ? 'Expand section' : 'Collapse section'}
						>
							<span class="chevron" class:collapsed={collapsed[group.node.Id]}>▾</span>
						</button>
						<h2 class="group-header">
							<a href="/nodes/{group.node.Id}">{group.node.Title}</a>
						</h2>
						<span class="group-count muted">{group.actions.length}</span>
					</div>
					{#if !collapsed[group.node.Id]}
						<ActionTable actions={group.actions} />
					{/if}
				</section>
			{/each}
		{/if}
	{/if}
</div>

<style>
	.group {
		margin-bottom: 2rem;
	}
	.group-header-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--border);
	}
	.group-header {
		margin: 0;
	}
	.group-header a {
		color: var(--text);
	}
	.group-count {
		margin-left: auto;
		font-size: 0.85rem;
	}
	.chevron-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.2rem;
		margin: -0.2rem;
		cursor: pointer;
		line-height: 1;
	}
	.chevron {
		display: inline-block;
		color: var(--text-muted);
		transition: transform 0.15s ease;
	}
	.chevron.collapsed {
		transform: rotate(-90deg);
	}
</style>
