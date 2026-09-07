<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import type { KnowledgeNode, LogEntry } from '$lib/types/api';
	import { onMount } from 'svelte';

	type NodeGroup = { node: KnowledgeNode; logs: LogEntry[] };

	let groups = $state<NodeGroup[]>([]);
	let loading = $state(true);
	let error = $state('');

	function preview(content: string): string {
		const plain = content.replace(/[#*_`>-]/g, '').trim();
		return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
	}

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
	<h1>Logs</h1>

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
				{#each group.logs as log (log.LogId)}
					<a class="log-row" href="/logs/{log.LogId}">
						<div class="log-row-main">
							<span class="log-title">{log.Title || preview(log.Content) || 'Empty entry'}</span>
							{#if log.Tags.length > 0 || log.ContributesToProgress}
								<div class="log-tags">
									{#if log.ContributesToProgress}
										<span class="tag-pill">progress</span>
									{/if}
									{#each log.Tags as tag (tag.TagId)}
										<span class="tag-pill">{tag.Name}</span>
									{/each}
								</div>
							{/if}
						</div>
						<span class="muted log-date">{new Date(log.EntryDate).toLocaleDateString()}</span>
					</a>
				{/each}
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

	.log-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius);
		color: inherit;
	}
	.log-row:hover {
		background: var(--bg-hover);
		text-decoration: none;
	}
	.log-row + .log-row {
		border-top: 1px solid var(--border);
	}

	.log-row-main {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
	}
	.log-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.log-tags {
		display: flex;
		gap: 0.3rem;
		flex-shrink: 0;
	}
	.log-date {
		flex-shrink: 0;
	}
</style>
