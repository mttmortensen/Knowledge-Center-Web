<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { actionsApi } from '$lib/api/actions';
	import ActionTable from '$lib/components/ActionTable.svelte';
	import type { KnowledgeNode, ActionItem } from '$lib/types/api';
	import { onMount } from 'svelte';

	type NodeGroup = { node: KnowledgeNode; actions: ActionItem[] };

	let statusFilter = $state<'Open' | 'Completed'>('Open');
	let allActions = $state<ActionItem[]>([]);
	let nodesById = $state<Map<number, KnowledgeNode>>(new Map());
	let loading = $state(true);
	let error = $state('');

	const groups = $derived.by((): NodeGroup[] => {
		const filtered = allActions.filter((a) => a.Status === statusFilter);
		const byNode = new Map<number, ActionItem[]>();
		for (const action of filtered) {
			const node = nodesById.get(action.KnowledgeNodeId);
			if (!node) continue;
			if (!byNode.has(action.KnowledgeNodeId)) byNode.set(action.KnowledgeNodeId, []);
			byNode.get(action.KnowledgeNodeId)!.push(action);
		}
		return [...byNode.entries()]
			.map(([nodeId, nodeActions]) => ({
				node: nodesById.get(nodeId)!,
				actions: [...nodeActions].sort(
					(a, b) =>
						new Date(b.CompletedAt ?? b.CreatedAt).getTime() -
						new Date(a.CompletedAt ?? a.CreatedAt).getTime()
				)
			}))
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
	{:else if groups.length === 0}
		<div class="empty-state">No {statusFilter === 'Open' ? 'open' : 'closed'} actions.</div>
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
