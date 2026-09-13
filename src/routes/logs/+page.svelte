<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import LogTable from '$lib/components/LogTable.svelte';
	import type { KnowledgeNode, LogEntry } from '$lib/types/api';
	import { onMount } from 'svelte';

	type NodeGroup = { node: KnowledgeNode; logs: LogEntry[] };

	let groups = $state<NodeGroup[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		loading = true;
		error = '';
		try {
			const [nodes, logs] = await Promise.all([
				knowledgeNodesApi.getAll(),
				logEntriesApi.getAll()
			]);
			const nodesById = new Map(nodes.map((node) => [node.Id, node]));
			const logsByNode = new Map<number, LogEntry[]>();
			for (const log of logs) {
				const node = nodesById.get(log.NodeId);
				if (!node) continue;
				if (!logsByNode.has(log.NodeId)) logsByNode.set(log.NodeId, []);
				logsByNode.get(log.NodeId)!.push(log);
			}
			// Row order within a group is the table's job — each LogTable keeps its
			// own sort, so groups sort independently.
			groups = [...logsByNode.entries()]
				.map(([nodeId, nodeLogs]) => ({ node: nodesById.get(nodeId)!, logs: nodeLogs }))
				.sort((a, b) => a.node.Title.localeCompare(b.node.Title));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load logs.';
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
		<h1>Logs</h1>
		<a href="/logs/new"><button class="primary">New log entry</button></a>
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if groups.length === 0}
		<div class="empty-state">No log entries yet.</div>
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
					<span class="group-count muted">{group.logs.length}</span>
				</div>
				{#if !collapsed[group.node.Id]}
					<LogTable logs={group.logs} />
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
