<script lang="ts">
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import type { Domain, KnowledgeNode } from '$lib/types/api';
	import KnowledgeNodeTable from '$lib/components/KnowledgeNodeTable.svelte';
	import { onMount } from 'svelte';

	let domains = $state<Domain[]>([]);
	let nodes = $state<KnowledgeNode[]>([]);
	let loading = $state(true);
	let error = $state('');

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
			[domains, nodes] = await Promise.all([domainsApi.getAll(), knowledgeNodesApi.getAll()]);
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

	let groups = $derived(
		domains
			.map((domain) => ({
				domain,
				nodes: nodes
					.filter((node) => node.DomainId === domain.DomainId)
					.sort((a, b) => a.Title.localeCompare(b.Title))
			}))
			.filter((group) => group.nodes.length > 0)
			.sort((a, b) => a.domain.DomainName.localeCompare(b.domain.DomainName))
	);
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
				<h2 class="group-header">
					<a href="/domains/{group.domain.DomainId}">{group.domain.DomainName}</a>
				</h2>
				<KnowledgeNodeTable nodes={group.nodes} />
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
