<script lang="ts">
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { actionsApi } from '$lib/api/actions';
	import type { Domain, KnowledgeNode } from '$lib/types/api';
	import KnowledgeNodeTable from '$lib/components/KnowledgeNodeTable.svelte';
	import { onMount } from 'svelte';

	let domains = $state<Domain[]>([]);
	let nodes = $state<KnowledgeNode[]>([]);
	let logCounts = $state<Map<number, number>>(new Map());
	let actionCounts = $state<Map<number, number>>(new Map());
	let loading = $state(true);
	let error = $state('');

	function countBy<T>(items: T[], keyOf: (item: T) => number): Map<number, number> {
		const counts = new Map<number, number>();
		for (const item of items) {
			const key = keyOf(item);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return counts;
	}

	let showCreate = $state(false);
	let nodeDomainId = $state<number | ''>('');
	let nodeTitle = $state('');
	let nodeType = $state('Concept');
	let nodeDescription = $state('');
	let nodeConfidence = $state(3);
	let nodeStatus = $state('Exploring');
	let creatingNode = $state(false);

	async function load() {
		loading = true;
		error = '';
		try {
			const [domainsResult, nodesResult, logs, openActions, completedActions] = await Promise.all([
				domainsApi.getAll(),
				knowledgeNodesApi.getAll(),
				logEntriesApi.getAll(),
				actionsApi.getAllOpen(),
				actionsApi.getAllCompleted()
			]);
			domains = domainsResult;
			nodes = nodesResult;
			logCounts = countBy(logs, (log) => log.NodeId);
			actionCounts = countBy([...openActions, ...completedActions], (action) => action.KnowledgeNodeId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load knowledge nodes.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function createNode(event: SubmitEvent) {
		event.preventDefault();
		if (!nodeDomainId) {
			error = 'Please select a domain.';
			return;
		}
		creatingNode = true;
		error = '';
		try {
			await knowledgeNodesApi.create({
				Title: nodeTitle,
				DomainId: nodeDomainId,
				NodeType: nodeType,
				Description: nodeDescription,
				ConfidenceLevel: nodeConfidence,
				Status: nodeStatus
			});
			nodeDomainId = '';
			nodeTitle = '';
			nodeDescription = '';
			nodeConfidence = 3;
			showCreate = false;
			await load();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create knowledge node.';
		} finally {
			creatingNode = false;
		}
	}

	// Row order within a group is the table's job — each KnowledgeNodeTable keeps
	// its own sort, so groups sort independently.
	let groups = $derived(
		domains
			.map((domain) => ({
				domain,
				nodes: nodes.filter((node) => node.DomainId === domain.DomainId)
			}))
			.filter((group) => group.nodes.length > 0)
			.sort((a, b) => a.domain.DomainName.localeCompare(b.domain.DomainName))
	);

	let collapsed = $state<Record<number, boolean>>({});
	function toggleGroup(domainId: number) {
		collapsed[domainId] = !collapsed[domainId];
	}
</script>

<div class="container">
	<div class="row-between">
		<h1>Knowledge Nodes</h1>
		<button class="primary" onclick={() => (showCreate = !showCreate)}>
			{showCreate ? 'Cancel' : 'New node'}
		</button>
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if showCreate}
		<form class="card" onsubmit={createNode}>
			<div class="field">
				<label for="node-domain">Domain</label>
				<select id="node-domain" bind:value={nodeDomainId} required>
					<option value="" disabled>Select a domain…</option>
					{#each domains as domain (domain.DomainId)}
						<option value={domain.DomainId}>{domain.DomainName}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="node-title">Title</label>
				<input id="node-title" type="text" bind:value={nodeTitle} required />
			</div>
			<div class="field">
				<label for="node-type">Type</label>
				<select id="node-type" bind:value={nodeType}>
					<option>Concept</option>
					<option>Project</option>
				</select>
			</div>
			<div class="field">
				<label for="node-description">Description</label>
				<textarea id="node-description" rows="2" bind:value={nodeDescription}></textarea>
			</div>
			<div class="field">
				<label for="node-confidence">Confidence (1-5)</label>
				<input
					id="node-confidence"
					type="number"
					min="1"
					max="5"
					bind:value={nodeConfidence}
				/>
			</div>
			<div class="field">
				<label for="node-status">Status</label>
				<select id="node-status" bind:value={nodeStatus}>
					<option>Exploring</option>
					<option>Learning</option>
					<option>Mastered</option>
				</select>
			</div>
			<button type="submit" class="primary" disabled={creatingNode}>
				{creatingNode ? 'Creating…' : 'Create node'}
			</button>
		</form>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if nodes.length === 0}
		<div class="empty-state">No knowledge nodes yet.</div>
	{:else}
		{#each groups as group (group.domain.DomainId)}
			<section class="group">
				<div class="group-header-row">
					<button
						type="button"
						class="chevron-btn"
						onclick={() => toggleGroup(group.domain.DomainId)}
						aria-expanded={!collapsed[group.domain.DomainId]}
						aria-label={collapsed[group.domain.DomainId] ? 'Expand section' : 'Collapse section'}
					>
						<span class="chevron" class:collapsed={collapsed[group.domain.DomainId]}>▾</span>
					</button>
					<h2 class="group-header">
						<a href="/domains/{group.domain.DomainId}">{group.domain.DomainName}</a>
					</h2>
					<span class="group-count muted">{group.nodes.length}</span>
				</div>
				{#if !collapsed[group.domain.DomainId]}
					<KnowledgeNodeTable nodes={group.nodes} {logCounts} {actionCounts} />
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
		margin-bottom: 0.75rem;
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
