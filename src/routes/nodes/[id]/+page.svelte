<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { actionsApi } from '$lib/api/actions';
	import { domainsApi } from '$lib/api/domains';
	import LogTable from '$lib/components/LogTable.svelte';
	import ActionTable from '$lib/components/ActionTable.svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';
	import type { Domain, KnowledgeNodeWithLogs, LogEntry, ActionItem } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';

	const nodeId = $derived(Number(page.params.id));

	let node = $state<KnowledgeNodeWithLogs | null>(null);
	let domain = $state<Domain | null>(null);
	let logs = $state<LogEntry[]>([]);
	let actions = $state<ActionItem[]>([]);
	let loading = $state(true);
	let error = $state('');

	let logsExpanded = $state(true);
	let actionsExpanded = $state(true);

	let editing = $state(false);
	let editTitle = $state('');
	let editType = $state('');
	let editDescription = $state('');
	let editConfidence = $state(3);
	let editStatus = $state('');
	let saving = $state(false);

	const metaRows: MetaRow[] = $derived.by(() => {
		if (!node) return [];
		return [
			{
				label: 'Domain',
				value: domain?.DomainName ?? `Domain ${node.DomainId}`,
				href: `/domains/${node.DomainId}`
			},
			{ label: 'Type', value: node.NodeType },
			{ label: 'Status', value: node.Status, pill: 'default' },
			{ label: 'Confidence', value: `${node.ConfidenceLevel} / 5` },
			{
				label: 'Log titles',
				value: `${logs.filter((l) => l.Title).length} of ${logs.length}`
			},
			{
				label: 'Comic titles',
				value: `${logs.filter((l) => !l.Title).length} of ${logs.length}`
			},
			{ label: 'Created', value: new Date(node.CreatedAt).toLocaleString() },
			{ label: 'Last updated', value: new Date(node.LastUpdated).toLocaleString() },
			{ label: 'Node ID', value: `#${node.Id}` }
		];
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const [nodeResult, logsResult, openActionsResult, completedActionsResult] = await Promise.all([
				knowledgeNodesApi.getById(nodeId),
				logEntriesApi.getAll(nodeId),
				actionsApi.getOpenForNode(nodeId),
				actionsApi.getCompletedForNode(nodeId)
			]);
			node = nodeResult;
			domainsApi
				.getById(nodeResult.DomainId)
				.then((d) => (domain = d))
				.catch(() => (domain = null));
			logs = [...logsResult].sort(
				(a, b) => new Date(b.EntryDate).getTime() - new Date(a.EntryDate).getTime()
			);
			actions = [
				...[...openActionsResult].sort(
					(a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
				),
				...[...completedActionsResult].sort(
					(a, b) =>
						new Date(b.CompletedAt ?? b.CreatedAt).getTime() -
						new Date(a.CompletedAt ?? a.CreatedAt).getTime()
				)
			];
			editTitle = node.Title;
			editType = node.NodeType;
			editDescription = node.Description;
			editConfidence = node.ConfidenceLevel;
			editStatus = node.Status;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load knowledge node.';
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
			await knowledgeNodesApi.update(nodeId, {
				Title: editTitle,
				NodeType: editType,
				Description: editDescription,
				ConfidenceLevel: editConfidence,
				Status: editStatus
			});
			editing = false;
			await load();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update knowledge node.';
		} finally {
			saving = false;
		}
	}

	async function deleteNode() {
		if (!confirm('Delete this knowledge node and all its log entries?')) return;
		try {
			await knowledgeNodesApi.delete(nodeId);
			goto(`/domains/${node?.DomainId}`);
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to delete knowledge node.';
		}
	}

</script>

<div class="container wide">
	<div class="breadcrumb">
		<a href="/domains">Domains</a> /
		<a href="/domains/{node?.DomainId}">{domain?.DomainName ?? 'Domain'}</a> / {node?.Title ?? '…'}
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if node}
		<div class="card">
			{#if editing}
				<form onsubmit={saveEdit}>
					<div class="field">
						<label for="edit-title">Title</label>
						<input id="edit-title" type="text" bind:value={editTitle} required />
					</div>
					<div class="field">
						<label for="edit-type">Type</label>
						<select id="edit-type" bind:value={editType}>
							<option>Concept</option>
							<option>Project</option>
						</select>
					</div>
					<div class="field">
						<label for="edit-description">Description</label>
						<textarea id="edit-description" rows="3" bind:value={editDescription}></textarea>
					</div>
					<div class="field">
						<label for="edit-confidence">Confidence (1-5)</label>
						<input id="edit-confidence" type="number" min="1" max="5" bind:value={editConfidence} />
					</div>
					<div class="field">
						<label for="edit-status">Status</label>
						<select id="edit-status" bind:value={editStatus}>
							<option>Exploring</option>
							<option>Learning</option>
							<option>Mastered</option>
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
					<h1>{node.Title}</h1>
					<span class="tag-pill">{node.Status}</span>
				</div>

				<h2 class="section-heading">Details</h2>
				<MetaPanel rows={metaRows} columns={2} />

				<h2 class="section-heading">Description</h2>
				<p class="node-description">{node.Description || 'No description yet.'}</p>

				<div class="row">
					<button onclick={() => (editing = true)} disabled={auth.isDemo}>Edit</button>
					<button class="danger" onclick={deleteNode} disabled={auth.isDemo}>Delete</button>
				</div>
				{#if auth.isDemo}
					<p class="muted">Editing and deleting are disabled in demo mode.</p>
				{/if}
			{/if}
		</div>

		<div class="split-columns">
			<div class="column">
				<div class="row-between">
					<button
						type="button"
						class="section-toggle"
						onclick={() => (logsExpanded = !logsExpanded)}
						aria-expanded={logsExpanded}
					>
						<span class="chevron" class:collapsed={!logsExpanded}>▾</span>
						<h2>Log Entries</h2>
					</button>
					<a href="/nodes/{nodeId}/logs/new"><button class="primary">New entry</button></a>
				</div>

				{#if logsExpanded}
					{#if logs.length === 0}
						<div class="empty-state">No log entries yet.</div>
					{:else}
						<LogTable {logs} />
					{/if}
				{/if}
			</div>

			<div class="column">
				<div class="row-between">
					<button
						type="button"
						class="section-toggle"
						onclick={() => (actionsExpanded = !actionsExpanded)}
						aria-expanded={actionsExpanded}
					>
						<span class="chevron" class:collapsed={!actionsExpanded}>▾</span>
						<h2>Actions</h2>
					</button>
					<a href="/nodes/{nodeId}/actions/new"><button class="primary">New action</button></a>
				</div>

				{#if actionsExpanded}
					{#if actions.length === 0}
						<div class="empty-state">No actions yet.</div>
					{:else}
						<ActionTable {actions} />
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.node-description {
		white-space: pre-wrap;
		margin: 0 0 1.25rem;
	}
	.container.wide {
		max-width: 1200px;
	}
	.split-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: start;
	}
	@media (max-width: 700px) {
		.split-columns {
			grid-template-columns: 1fr;
		}
	}
	.section-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}
	.section-toggle h2 {
		margin: 0;
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
