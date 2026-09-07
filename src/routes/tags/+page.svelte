<script lang="ts">
	import { onMount } from 'svelte';
	import { tagsApi } from '$lib/api/tags';
	import type { Tag } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';

	let tags = $state<Tag[]>([]);
	let loading = $state(true);
	let error = $state('');

	let newTagName = $state('');
	let creating = $state(false);

	let editingId = $state<number | null>(null);
	let editingName = $state('');

	async function load() {
		loading = true;
		error = '';
		try {
			tags = await tagsApi.getAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load tags.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function createTag(event: SubmitEvent) {
		event.preventDefault();
		if (!newTagName.trim()) return;
		creating = true;
		error = '';
		try {
			await tagsApi.create(newTagName.trim());
			newTagName = '';
			await load();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create tag.';
		} finally {
			creating = false;
		}
	}

	function startEdit(tag: Tag) {
		editingId = tag.TagId;
		editingName = tag.Name;
	}

	async function saveEdit(id: number) {
		try {
			await tagsApi.update(id, editingName);
			editingId = null;
			await load();
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to rename tag.';
		}
	}

	async function deleteTag(id: number) {
		if (!confirm('Delete this tag? It will be removed from any entries using it.')) return;
		try {
			await tagsApi.delete(id);
			await load();
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to delete tag.';
		}
	}
</script>

<div class="container">
	<h1>Tags</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<form class="card row" onsubmit={createTag}>
		<input type="text" placeholder="New tag name" bind:value={newTagName} />
		<button type="submit" class="primary" disabled={creating}>Add</button>
	</form>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if tags.length === 0}
		<div class="empty-state">No tags yet.</div>
	{:else}
		<div class="card">
			{#each tags as tag (tag.TagId)}
				<div class="row-between" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
					{#if editingId === tag.TagId}
						<input type="text" bind:value={editingName} style="max-width: 220px;" />
						<div class="row">
							<button onclick={() => saveEdit(tag.TagId)}>Save</button>
							<button onclick={() => (editingId = null)}>Cancel</button>
						</div>
					{:else}
						<span class="tag-pill">{tag.Name}</span>
						<div class="row">
							<button onclick={() => startEdit(tag)} disabled={auth.isDemo}>Rename</button>
							<button class="danger" onclick={() => deleteTag(tag.TagId)} disabled={auth.isDemo}
								>Delete</button
							>
						</div>
					{/if}
				</div>
			{/each}
		</div>
		{#if auth.isDemo}
			<p class="muted">Renaming and deleting are disabled in demo mode.</p>
		{/if}
	{/if}
</div>
