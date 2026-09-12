<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';
	import { actionsApi } from '$lib/api/actions';
	import { loadParentContext, type ParentContext } from '$lib/api/parents';

	const nodeId = $derived(Number(page.params.id));

	let parent = $state<ParentContext>({ node: null, domain: null });

	const metaRows: MetaRow[] = $derived.by(() => {
		const node = parent.node;
		return [
			{
				label: 'Domain',
				value: parent.domain?.DomainName ?? (node ? `Domain ${node.DomainId}` : null),
				href: node ? `/domains/${node.DomainId}` : undefined
			},
			{
				label: 'Knowledge node',
				value: node?.Title ?? `Node ${nodeId}`,
				href: `/nodes/${nodeId}`
			},
			{ label: 'Node type', value: node ? `${node.NodeType} · ${node.Status}` : null }
		];
	});

	onMount(async () => {
		parent = await loadParentContext(nodeId);
	});

	let actionText = $state('');
	let saving = $state(false);
	let error = $state('');

	async function save(event: SubmitEvent) {
		event.preventDefault();
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
	<div class="breadcrumb">
		<a href="/domains">Domains</a> /
		{#if parent.node}
			<a href="/domains/{parent.node.DomainId}">{parent.domain?.DomainName ?? 'Domain'}</a> /
		{/if}
		<a href="/nodes/{nodeId}">{parent.node?.Title ?? 'Node'}</a> / New action
	</div>
	<h1>New Action</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<h2 class="section-heading">Filed under</h2>
	<div class="card meta-card">
		<MetaPanel rows={metaRows} />
	</div>

	<h2 class="section-heading">Action text</h2>

	<form onsubmit={save}>
		<div class="field">
			<label for="action-text">Action</label>
			<textarea id="action-text" rows="3" bind:value={actionText} required></textarea>
		</div>

		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Saving…' : 'Create action'}
		</button>
	</form>
</div>
