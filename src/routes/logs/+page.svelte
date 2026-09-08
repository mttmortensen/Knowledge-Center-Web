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
			groups = [...logsByNode.entries()]
				.map(([nodeId, nodeLogs]) => ({
					node: nodesById.get(nodeId)!,
					logs: [...nodeLogs].sort(
						(a, b) => new Date(b.EntryDate).getTime() - new Date(a.EntryDate).getTime()
					)
				}))
				.sort((a, b) => a.node.Title.localeCompare(b.node.Title));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load logs.';
		} finally {
			loading = false;
		}
	}

	onMount(load);
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
				<h2 class="group-header">
					<a href="/nodes/{group.node.Id}">{group.node.Title}</a>
				</h2>
				<LogTable logs={group.logs} />
			</section>
		{/each}
	{/if}
</div>

<style>
	.group {
		margin-bottom: 2rem;
	}
	.group-header {
		margin-bottom: 0.5rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--border);
	}
	.group-header a {
		color: var(--text);
	}
</style>
