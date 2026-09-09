<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import type { DomainWithKNs } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';
	import KnowledgeNodeTable from '$lib/components/KnowledgeNodeTable.svelte';

	const domainId = $derived(Number(page.params.id));

	let domain = $state<DomainWithKNs | null>(null);
	let loading = $state(true);
	let error = $state('');

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
			domain = await domainsApi.getById(domainId);
			// Demo mode's GET-by-id returns a bare Domain (no KnowledgeNodes array),
			// unlike the real API's DomainWithKNsDto — default it so the list below
			// doesn't blow up on undefined.
			domain.KnowledgeNodes ??= [];
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
				{#if domain.DomainDescription}
					<p class="muted">{domain.DomainDescription}</p>
				{/if}
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
			<KnowledgeNodeTable nodes={domain.KnowledgeNodes} />
		{/if}
	{/if}
</div>
