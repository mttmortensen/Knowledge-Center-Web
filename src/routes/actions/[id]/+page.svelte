<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { actionsApi } from '$lib/api/actions';
	import { loadParentContext, type ParentContext } from '$lib/api/parents';
	import NodeSelect from '$lib/components/NodeSelect.svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';
	import type { ActionItem } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';

	const actionId = $derived(Number(page.params.id));

	let action = $state<ActionItem | null>(null);
	let parent = $state<ParentContext>({ node: null, domain: null });
	let loading = $state(true);
	let error = $state('');

	let editing = $state(false);
	let editText = $state('');
	let editNodeId = $state(0);
	let saving = $state(false);

	// Closing asks for an optional follow-up first; a closed action's note
	// can be added, edited or cleared afterwards.
	let completing = $state(false);
	let editingFollowUp = $state(false);
	let followUpText = $state('');
	let savingFollowUp = $state(false);

	function statusLabel(status: string): string {
		return status === 'Completed' ? 'Closed' : status;
	}

	const metaRows: MetaRow[] = $derived.by(() => {
		if (!action) return [];
		const node = parent.node;
		const domain = parent.domain;
		return [
			{
				label: 'Domain',
				value: domain?.DomainName ?? (node ? `Domain ${node.DomainId}` : null),
				href: node ? `/domains/${node.DomainId}` : undefined
			},
			{
				label: 'Knowledge node',
				value: node?.Title ?? `Node ${action.KnowledgeNodeId}`,
				href: `/nodes/${action.KnowledgeNodeId}`
			},
			{
				label: 'Node type',
				value: node ? `${node.NodeType} · ${node.Status}` : null
			},
			{
				label: 'Status',
				value: statusLabel(action.Status),
				pill: action.Status === 'Open' ? 'open' : 'completed'
			},
			{ label: 'Created', value: new Date(action.CreatedAt).toLocaleString() },
			{
				label: 'Completed',
				value: action.CompletedAt ? new Date(action.CompletedAt).toLocaleString() : null
			},
			{ label: 'Action ID', value: `#${action.Id}` }
		];
	});

	async function load() {
		loading = true;
		error = '';
		try {
			action = await actionsApi.getById(actionId);
			editText = action.ActionText;
			editNodeId = action.KnowledgeNodeId;
			parent = await loadParentContext(action.KnowledgeNodeId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load action.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function saveEdit() {
		if (!action) return;
		saving = true;
		error = '';
		try {
			await actionsApi.update(actionId, { ActionText: editText });
			if (editNodeId !== action.KnowledgeNodeId) await actionsApi.move(actionId, editNodeId);
			editing = false;
			await load();
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to save changes.';
		} finally {
			saving = false;
		}
	}

	function startCompleting() {
		followUpText = '';
		completing = true;
	}

	async function complete() {
		if (!action) return;
		savingFollowUp = true;
		error = '';
		try {
			action = await actionsApi.complete(actionId, followUpText.trim());
			completing = false;
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to update status.';
		} finally {
			savingFollowUp = false;
		}
	}

	async function reopen() {
		if (!action) return;
		error = '';
		try {
			action = await actionsApi.reopen(actionId);
			editingFollowUp = false;
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to update status.';
		}
	}

	function startEditingFollowUp() {
		followUpText = action?.FollowUp ?? '';
		editingFollowUp = true;
	}

	async function saveFollowUp() {
		if (!action) return;
		savingFollowUp = true;
		error = '';
		try {
			action = await actionsApi.updateFollowUp(actionId, followUpText.trim());
			editingFollowUp = false;
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to save follow-up.';
		} finally {
			savingFollowUp = false;
		}
	}

	async function deleteAction() {
		if (!action) return;
		if (!confirm('Delete this action?')) return;
		try {
			await actionsApi.delete(actionId);
			goto(`/nodes/${action.KnowledgeNodeId}`);
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to delete action.';
		}
	}
</script>

<div class="container">
	{#if action}
		<div class="breadcrumb">
			<a href="/domains">Domains</a> /
			{#if parent.node}
				<a href="/domains/{parent.node.DomainId}">{parent.domain?.DomainName ?? 'Domain'}</a> /
			{/if}
			<a href="/nodes/{action.KnowledgeNodeId}">{parent.node?.Title ?? 'Node'}</a> / Action
		</div>
	{/if}

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if action}
		<div class="row-between">
			<h1>Action</h1>
			<span
				class="tag-pill"
				class:open={action.Status === 'Open'}
				class:completed={action.Status === 'Completed'}
			>
				{statusLabel(action.Status)}
			</span>
		</div>

		<h2 class="section-heading">Details</h2>
		<div class="card meta-card">
			<MetaPanel rows={metaRows} />
		</div>

		<h2 class="section-heading">Action text</h2>
		{#if editing}
			<div class="field">
				<label for="edit-text">Action</label>
				<textarea id="edit-text" rows="3" bind:value={editText}></textarea>
			</div>
			<div class="field">
				<label for="edit-node">Knowledge node</label>
				<NodeSelect id="edit-node" bind:value={editNodeId} current={parent.node} />
			</div>
			<div class="row">
				<button class="primary" onclick={saveEdit} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</button>
				<button
					onclick={() => {
						editing = false;
						editText = action!.ActionText;
						editNodeId = action!.KnowledgeNodeId;
					}}>Cancel</button
				>
			</div>
		{:else}
			<div class="card">
				<p class="action-text">{action.ActionText}</p>
			</div>
			{#if completing}
				<div class="field" style="margin-top: 1rem;">
					<label for="complete-follow-up">Follow-up (optional)</label>
					<textarea
						id="complete-follow-up"
						rows="3"
						maxlength="2000"
						placeholder="What happened after?"
						bind:value={followUpText}
					></textarea>
				</div>
				<div class="row">
					<button class="primary" onclick={complete} disabled={savingFollowUp}>
						{savingFollowUp ? 'Closing…' : 'Close action'}
					</button>
					<button onclick={() => (completing = false)}>Cancel</button>
				</div>
			{:else}
				<div class="row" style="margin-top: 1rem;">
					<button onclick={() => (editing = true)} disabled={auth.isDemo}>Edit</button>
					{#if action.Status === 'Open'}
						<button onclick={startCompleting} disabled={auth.isDemo}>Mark complete</button>
					{:else}
						<button onclick={reopen} disabled={auth.isDemo}>Reopen</button>
					{/if}
					<button class="danger" onclick={deleteAction} disabled={auth.isDemo}>Delete</button>
				</div>
			{/if}
			{#if auth.isDemo}
				<p class="muted">Editing and deleting are disabled in demo mode.</p>
			{/if}
		{/if}

		<!-- The note survives a reopen, so show it on open actions too, but the
		     API only lets a closed action's note change. -->
		{#if action.Status === 'Completed' || action.FollowUp}
			<h2 class="section-heading">Follow-up</h2>
			{#if editingFollowUp}
				<div class="field">
					<label for="edit-follow-up">Follow-up</label>
					<textarea
						id="edit-follow-up"
						rows="3"
						maxlength="2000"
						placeholder="What happened after?"
						bind:value={followUpText}
					></textarea>
				</div>
				<div class="row">
					<button class="primary" onclick={saveFollowUp} disabled={savingFollowUp}>
						{savingFollowUp ? 'Saving…' : 'Save'}
					</button>
					<button onclick={() => (editingFollowUp = false)}>Cancel</button>
				</div>
				<p class="muted">Leave it blank to remove the follow-up.</p>
			{:else}
				{#if action.FollowUp}
					<div class="card">
						<p class="action-text">{action.FollowUp}</p>
					</div>
				{:else}
					<p class="muted">No follow-up yet.</p>
				{/if}
				{#if action.Status === 'Completed'}
					<div class="row" style="margin-top: 1rem;">
						<button onclick={startEditingFollowUp} disabled={auth.isDemo}>
							{action.FollowUp ? 'Edit follow-up' : 'Add follow-up'}
						</button>
					</div>
				{:else}
					<p class="muted">Close the action again to change its follow-up.</p>
				{/if}
			{/if}
		{/if}
	{/if}
</div>

<style>
	.action-text {
		margin: 0;
		white-space: pre-wrap;
	}
</style>
