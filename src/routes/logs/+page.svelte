<script lang="ts">
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import type { KnowledgeNode, LogEntryInline } from '$lib/types/api';
	import { onMount } from 'svelte';

	type NodeGroup = { node: KnowledgeNode; logs: LogEntryInline[] };

	let groups = $state<NodeGroup[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		loading = true;
		error = '';
		try {
			const nodes = await knowledgeNodesApi.getAll();
			const withLogs = await Promise.all(
				nodes.map(async (node) => ({
					node,
					logs: (await knowledgeNodesApi.getById(node.Id)).Logs
				}))
			);
			groups = withLogs
				.filter((group) => group.logs.length > 0)
				.map((group) => ({
					...group,
					logs: [...group.logs].sort(
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
					<a class="card card-link" href="/logs/{log.LogId}">
						<div class="row-between">
							<h3>{log.Title || 'Untitled entry'}</h3>
							<span class="muted">{new Date(log.EntryDate).toLocaleDateString()}</span>
						</div>
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
		margin-bottom: 0.75rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--border);
	}
	.group-header a {
		color: var(--text);
	}
</style>
