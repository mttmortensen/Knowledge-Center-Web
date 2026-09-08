<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import LogTable from '$lib/components/LogTable.svelte';
	import type { KnowledgeNodeWithLogs, LogEntry } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';

	const nodeId = $derived(Number(page.params.id));

	let node = $state<KnowledgeNodeWithLogs | null>(null);
	let logs = $state<LogEntry[]>([]);
	let loading = $state(true);
	let error = $state('');

	let editing = $state(false);
	let editTitle = $state('');
	let editType = $state('');
	let editDescription = $state('');
	let editConfidence = $state(3);
	let editStatus = $state('');
	let saving = $state(false);

	async function load() {
		loading = true;
		error = '';
		try {
			const [nodeResult, logsResult] = await Promise.all([
				knowledgeNodesApi.getById(nodeId),
				logEntriesApi.getAll(nodeId)
			]);
			node = nodeResult;
			logs = [...logsResult].sort(
				(a, b) => new Date(b.EntryDate).getTime() - new Date(a.EntryDate).getTime()
			);
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

<div class="container">
	<div class="breadcrumb">
		<a href="/domains">Domains</a> /
		<a href="/domains/{node?.DomainId}">Domain</a> / {node?.Title ?? '…'}
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
						<input id="edit-type" type="text" bind:value={editType} />
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
							<option>Active</option>
							<option>Archived</option>
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
				<p class="muted">{node.NodeType} · confidence {node.ConfidenceLevel}/5</p>
				{#if node.Description}
					<p>{node.Description}</p>
				{/if}
				<div class="row">
					<button onclick={() => (editing = true)} disabled={auth.isDemo}>Edit</button>
					<button class="danger" onclick={deleteNode} disabled={auth.isDemo}>Delete</button>
				</div>
				{#if auth.isDemo}
					<p class="muted">Editing and deleting are disabled in demo mode.</p>
				{/if}
			{/if}
		</div>

		<div class="row-between">
			<h2>Log Entries</h2>
			<a href="/nodes/{nodeId}/logs/new"><button class="primary">New entry</button></a>
		</div>

		{#if logs.length === 0}
			<div class="empty-state">No log entries yet.</div>
		{:else}
			<LogTable {logs} />
		{/if}
	{/if}
</div>
