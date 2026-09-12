<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { domainsApi } from '$lib/api/domains';
	import { actionsApi } from '$lib/api/actions';
	import type { Domain, KnowledgeNode } from '$lib/types/api';

	let nodes = $state<KnowledgeNode[]>([]);
	let domains = $state<Domain[]>([]);
	let loadingNodes = $state(true);

	let nodeId = $state<number | ''>('');
	let actionText = $state('');
	let saving = $state(false);
	let error = $state('');

	const selectedNode = $derived(nodes.find((n) => n.Id === nodeId) ?? null);

	const metaRows: MetaRow[] = $derived.by(() => {
		const node = selectedNode;
		if (!node) return [];
		const domain = domains.find((d) => d.DomainId === node.DomainId);
		return [
			{
				label: 'Domain',
				value: domain?.DomainName ?? `Domain ${node.DomainId}`,
				href: `/domains/${node.DomainId}`
			},
			{ label: 'Knowledge node', value: node.Title, href: `/nodes/${node.Id}` },
			{ label: 'Node type', value: `${node.NodeType} · ${node.Status}` }
		];
	});

	async function loadNodes() {
		loadingNodes = true;
		try {
			nodes = [...(await knowledgeNodesApi.getAll())].sort((a, b) =>
				a.Title.localeCompare(b.Title)
			);
			domainsApi
				.getAll()
				.then((d) => (domains = d))
				.catch(() => (domains = []));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load knowledge nodes.';
		} finally {
			loadingNodes = false;
		}
	}

	onMount(loadNodes);

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!nodeId) {
			error = 'Please select a knowledge node.';
			return;
		}
		if (!actionText.trim()) {
			error = 'Action text cannot be empty.';
			return;
		}
		saving = true;
		error = '';
		try {
			await actionsApi.create({ KnowledgeNodeId: nodeId, ActionText: actionText });
			goto(`/nodes/${nodeId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create action.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href="/actions">Actions</a> / New action</div>
	<h1>New Action</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loadingNodes}
		<p class="muted">Loading…</p>
	{:else if nodes.length === 0}
		<div class="empty-state">No knowledge nodes yet. Create one before adding an action.</div>
	{:else}
		<form onsubmit={save}>
			<h2 class="section-heading">Filed under</h2>
			<div class="card meta-card">
				<div class="field" class:flush={!selectedNode}>
					<label for="node">Knowledge Node</label>
					<select id="node" bind:value={nodeId} required>
						<option value="" disabled>Select a node…</option>
						{#each nodes as node (node.Id)}
							<option value={node.Id}>{node.Title}</option>
						{/each}
					</select>
				</div>
				{#if selectedNode}
					<MetaPanel rows={metaRows} />
				{/if}
			</div>

			<h2 class="section-heading">Action text</h2>

			<div class="field">
				<label for="action-text">Action</label>
				<textarea id="action-text" rows="3" bind:value={actionText} required></textarea>
			</div>

			<button type="submit" class="primary" disabled={saving}>
				{saving ? 'Saving…' : 'Create action'}
			</button>
		</form>
	{/if}
</div>

<style>
	.field.flush {
		margin-bottom: 0;
	}
</style>
