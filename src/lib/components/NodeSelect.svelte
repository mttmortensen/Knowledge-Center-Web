<script lang="ts">
	import { onMount } from 'svelte';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { domainsApi } from '$lib/api/domains';
	import type { Domain, KnowledgeNode } from '$lib/types/api';

	/**
	 * Picks a knowledge node to move something under, grouped by domain.
	 * Archived nodes can't be moved into, but `current` is always listed so the
	 * select still shows where the item lives today.
	 */
	let {
		value = $bindable(),
		current = null,
		id = 'node'
	}: { value: number; current?: KnowledgeNode | null; id?: string } = $props();

	let nodes = $state<KnowledgeNode[]>([]);
	let domains = $state<Domain[]>([]);
	let error = $state('');

	const groups = $derived.by(() => {
		const all = current && !nodes.some((n) => n.Id === current.Id) ? [...nodes, current] : nodes;
		const byDomain = new Map<number, KnowledgeNode[]>();
		for (const node of all) {
			byDomain.set(node.DomainId, [...(byDomain.get(node.DomainId) ?? []), node]);
		}
		return [...byDomain.entries()]
			.map(([domainId, members]) => ({
				label: domains.find((d) => d.DomainId === domainId)?.DomainName ?? `Domain ${domainId}`,
				nodes: members.sort((a, b) => a.Title.localeCompare(b.Title))
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	});

	onMount(async () => {
		try {
			[nodes, domains] = await Promise.all([knowledgeNodesApi.getAll(), domainsApi.getAll(true)]);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load knowledge nodes.';
		}
	});
</script>

<select {id} bind:value>
	{#each groups as group (group.label)}
		<optgroup label={group.label}>
			{#each group.nodes as node (node.Id)}
				<option value={node.Id}>
					{node.Title}{node.IsArchived ? ' (archived)' : ''}
				</option>
			{/each}
		</optgroup>
	{/each}
</select>
{#if error}
	<p class="muted">{error}</p>
{/if}
