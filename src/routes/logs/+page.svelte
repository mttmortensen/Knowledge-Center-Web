<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import LogTable from '$lib/components/LogTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { ANY, matchesQuery, matchesSelect, type FilterSelect } from '$lib/utils/tableFilter';
	import type { KnowledgeNode, LogEntry } from '$lib/types/api';
	import { onMount } from 'svelte';

	type NodeGroup = { node: KnowledgeNode; logs: LogEntry[] };

	let nodes = $state<KnowledgeNode[]>([]);
	let logs = $state<LogEntry[]>([]);
	let loading = $state(true);
	let error = $state('');

	let search = $state('');
	let filters = $state<Record<string, string>>({ node: ANY, tag: ANY });

	const nodesById = $derived(new Map(nodes.map((node) => [node.Id, node])));

	/** Logs whose node is gone are dropped everywhere, filters included. */
	const knownLogs = $derived(logs.filter((log) => nodesById.has(log.NodeId)));

	const filterSelects = $derived.by((): FilterSelect[] => {
		const nodeIds = new Set(knownLogs.map((log) => log.NodeId));
		const tagNames = new Set(knownLogs.flatMap((log) => log.Tags.map((tag) => tag.Name)));
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
				key: 'tag',
				label: 'Tag',
				allLabel: 'All tags',
				options: [...tagNames]
					.sort((a, b) => a.localeCompare(b))
					.map((name) => ({ value: name, label: name }))
			}
		];
	});

	const visibleLogs = $derived(
		knownLogs.filter(
			(log) =>
				matchesQuery(
					search,
					log.Title,
					log.Content,
					log.Tags.map((tag) => tag.Name).join(' '),
					nodesById.get(log.NodeId)?.Title
				) &&
				matchesSelect(filters.node, log.NodeId) &&
				(filters.tag === ANY || log.Tags.some((tag) => tag.Name === filters.tag))
		)
	);

	// Row order within a group is the table's job — each LogTable keeps its
	// own sort, so groups sort independently.
	const groups = $derived.by((): NodeGroup[] => {
		const logsByNode = new Map<number, LogEntry[]>();
		for (const log of visibleLogs) {
			if (!logsByNode.has(log.NodeId)) logsByNode.set(log.NodeId, []);
			logsByNode.get(log.NodeId)!.push(log);
		}
		return [...logsByNode.entries()]
			.map(([nodeId, nodeLogs]) => ({ node: nodesById.get(nodeId)!, logs: nodeLogs }))
			.sort((a, b) => a.node.Title.localeCompare(b.node.Title));
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const [nodesResult, logsResult] = await Promise.all([
				knowledgeNodesApi.getAll(),
				logEntriesApi.getAll()
			]);
			nodes = nodesResult;
			logs = logsResult;
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
	{:else if knownLogs.length === 0}
		<div class="empty-state">No log entries yet.</div>
	{:else}
		<FilterBar
			bind:search
			bind:values={filters}
			selects={filterSelects}
			placeholder="Search title, content, or tag…"
			searchLabel="Search log entries"
			shown={visibleLogs.length}
			total={knownLogs.length}
			itemLabel="entries"
		/>
		{#if groups.length === 0}
			<div class="empty-state">No log entries match these filters.</div>
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
