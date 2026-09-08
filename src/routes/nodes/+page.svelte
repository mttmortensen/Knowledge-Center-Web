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
	<h1>Knowledge Nodes</h1>

	{#if error}
		<div class="error-banner">{error}</div>
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
