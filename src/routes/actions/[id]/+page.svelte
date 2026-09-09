<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { actionsApi } from '$lib/api/actions';
	import type { ActionItem } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';

	const actionId = $derived(Number(page.params.id));

	let action = $state<ActionItem | null>(null);
	let loading = $state(true);
	let error = $state('');

	let editing = $state(false);
	let editText = $state('');
	let saving = $state(false);

	function statusLabel(status: string): string {
		return status === 'Completed' ? 'Closed' : status;
	}

	async function load() {
		loading = true;
		error = '';
		try {
			action = await actionsApi.getById(actionId);
			editText = action.ActionText;
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

	async function toggleStatus() {
		if (!action) return;
		error = '';
		try {
			action =
				action.Status === 'Open'
					? await actionsApi.complete(actionId)
					: await actionsApi.reopen(actionId);
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to update status.';
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
		<div class="breadcrumb"><a href="/nodes/{action.KnowledgeNodeId}">Back to node</a></div>
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

		{#if editing}
			<div class="field">
				<label for="edit-text">Action</label>
				<textarea id="edit-text" rows="3" bind:value={editText}></textarea>
			</div>
			<div class="row">
				<button class="primary" onclick={saveEdit} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</button>
				<button
					onclick={() => {
						editing = false;
						editText = action!.ActionText;
					}}>Cancel</button
				>
			</div>
		{:else}
			<p>{action.ActionText}</p>
			<p class="muted">
				Created {new Date(action.CreatedAt).toLocaleString()}
				{#if action.CompletedAt}
					· Completed {new Date(action.CompletedAt).toLocaleString()}
				{/if}
			</p>
			<div class="row" style="margin-top: 1rem;">
				<button onclick={() => (editing = true)} disabled={auth.isDemo}>Edit</button>
				<button onclick={toggleStatus} disabled={auth.isDemo}>
					{action.Status === 'Open' ? 'Mark complete' : 'Reopen'}
				</button>
				<button class="danger" onclick={deleteAction} disabled={auth.isDemo}>Delete</button>
			</div>
			{#if auth.isDemo}
				<p class="muted">Editing and deleting are disabled in demo mode.</p>
			{/if}
		{/if}
	{/if}
</div>
