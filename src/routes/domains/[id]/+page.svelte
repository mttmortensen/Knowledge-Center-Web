<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { actionsApi } from '$lib/api/actions';
	import type { DomainWithKNs } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';
	import KnowledgeNodeTable from '$lib/components/KnowledgeNodeTable.svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';

	const domainId = $derived(Number(page.params.id));

	let domain = $state<DomainWithKNs | null>(null);
	let logCounts = $state<Map<number, number>>(new Map());
	let actionCounts = $state<Map<number, number>>(new Map());
	let logTotal = $state(0);
	let openActionTotal = $state(0);
	let completedActionTotal = $state(0);
	let loading = $state(true);
	let error = $state('');

	const metaRows: MetaRow[] = $derived.by(() => {
		if (!domain) return [];
		const nodes = domain.KnowledgeNodes ?? [];
		const concepts = nodes.filter((n) => n.NodeType === 'Concept').length;
		const projects = nodes.filter((n) => n.NodeType === 'Project').length;
		return [
			{ label: 'Status', value: domain.DomainStatus, pill: 'default' },
			{ label: 'Knowledge nodes', value: `${nodes.length}` },
			{ label: 'Concepts', value: `${concepts} of ${nodes.length}` },
			{ label: 'Created', value: new Date(domain.CreatedAt).toLocaleString() },
			{ label: 'Projects', value: `${projects} of ${nodes.length}` },
			{ label: 'Last used', value: new Date(domain.LastUsed).toLocaleString() },
			{ label: 'Log entries', value: `${logTotal}` },
			{ label: 'Last updated', value: new Date(domain.LastUpdated).toLocaleString() },
			{
				label: 'Actions',
				value: `${openActionTotal} open · ${completedActionTotal} closed`
			},
			{ label: 'Domain ID', value: `#${domain.DomainId}` }
		];
	});

	function countBy<T>(items: T[], keyOf: (item: T) => number): Map<number, number> {
		const counts = new Map<number, number>();
		for (const item of items) {
			const key = keyOf(item);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return counts;
	}

	let editing = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let editStatus = $state('');
	let saving = $state(false);

	let showCreateNode = $state(false);
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
			const [domainResult, logs, openActions, completedActions] = await Promise.all([
				domainsApi.getById(domainId),
				logEntriesApi.getAll(),
				actionsApi.getAllOpen(),
				actionsApi.getAllCompleted()
			]);
			domain = domainResult;
			// Demo mode's GET-by-id returns a bare Domain (no KnowledgeNodes array),
			// unlike the real API's DomainWithKNsDto — default it so the list below
			// doesn't blow up on undefined.
			domain.KnowledgeNodes ??= [];
			logCounts = countBy(logs, (log) => log.NodeId);
			actionCounts = countBy([...openActions, ...completedActions], (action) => action.KnowledgeNodeId);

			const nodeIds = new Set(domain.KnowledgeNodes.map((node) => node.Id));
			logTotal = logs.filter((log) => nodeIds.has(log.NodeId)).length;
			openActionTotal = openActions.filter((a) => nodeIds.has(a.KnowledgeNodeId)).length;
			completedActionTotal = completedActions.filter((a) => nodeIds.has(a.KnowledgeNodeId)).length;

			editName = domain.DomainName;
			editDescription = domain.DomainDescription;
			editStatus = domain.DomainStatus;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load domain.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function saveEdit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		error = '';
		try {
			await domainsApi.update(domainId, {
				DomainName: editName,
				DomainDescription: editDescription,
				DomainStatus: editStatus
			});
			editing = false;
			await load();
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to update domain.';
		} finally {
			saving = false;
		}
	}

	async function deleteDomain() {
		if (!confirm('Delete this domain? This does not delete its knowledge nodes on the server side automatically — check before confirming.')) return;
		try {
			await domainsApi.delete(domainId);
			goto('/domains');
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to delete domain.';
		}
	}

	async function createNode(event: SubmitEvent) {
		event.preventDefault();
		creatingNode = true;
		error = '';
		try {
			await knowledgeNodesApi.create({
				Title: nodeTitle,
				DomainId: domainId,
				NodeType: nodeType,
				Description: nodeDescription,
				ConfidenceLevel: nodeConfidence,
				Status: nodeStatus
			});
			nodeTitle = '';
			nodeDescription = '';
			nodeConfidence = 3;
			showCreateNode = false;
			await load();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create knowledge node.';
		} finally {
			creatingNode = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href="/domains">Domains</a> / {domain?.DomainName ?? '…'}</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if domain}
		<div class="card">
			{#if editing}
				<form onsubmit={saveEdit}>
					<div class="field">
						<label for="edit-name">Name</label>
						<input id="edit-name" type="text" bind:value={editName} required />
					</div>
					<div class="field">
						<label for="edit-description">Description</label>
						<textarea id="edit-description" rows="2" bind:value={editDescription}></textarea>
					</div>
					<div class="field">
						<label for="edit-status">Status</label>
						<select id="edit-status" bind:value={editStatus}>
							<option>Active</option>
							<option>Inactive</option>
						</select>
					</div>
					<div class="row">
						<button type="submit" class="primary" disabled={saving}>
							{saving ? 'Saving…' : 'Save'}
						</button>
						<button type="button" onclick={() => (editing = false)}>Cancel</button>
					</div>
				</form>
			{:else}
				<div class="row-between">
					<h1>{domain.DomainName}</h1>
					<span class="tag-pill">{domain.DomainStatus}</span>
				</div>

				<h2 class="section-heading">Details</h2>
				<MetaPanel rows={metaRows} columns={2} />

				<h2 class="section-heading">Description</h2>
				<p class="domain-description">{domain.DomainDescription || 'No description yet.'}</p>

				<div class="row">
					<button onclick={() => (editing = true)} disabled={auth.isDemo}>Edit</button>
					<button class="danger" onclick={deleteDomain} disabled={auth.isDemo}>Delete</button>
				</div>
				{#if auth.isDemo}
					<p class="muted">Editing and deleting are disabled in demo mode.</p>
				{/if}
			{/if}
		</div>

		<div class="row-between">
			<h2>Knowledge Nodes</h2>
			<button class="primary" onclick={() => (showCreateNode = !showCreateNode)}>
				{showCreateNode ? 'Cancel' : 'New node'}
			</button>
		</div>

		{#if showCreateNode}
			<form class="card" onsubmit={createNode}>
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

		{#if domain.KnowledgeNodes.length === 0}
			<div class="empty-state">No knowledge nodes in this domain yet.</div>
		{:else}
			<KnowledgeNodeTable nodes={domain.KnowledgeNodes} {logCounts} {actionCounts} />
		{/if}
	{/if}
</div>

<style>
	.domain-description {
		white-space: pre-wrap;
		margin: 0 0 1.25rem;
	}
</style>
