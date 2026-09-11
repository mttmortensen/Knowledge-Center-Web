<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { uploadImage } from '$lib/api/images';
	import type { LogEntry } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';
	import { comicTitle, comicByline } from '$lib/utils/comicTitle';

	const logId = $derived(Number(page.params.id));

	let entry = $state<LogEntry | null>(null);
	let loading = $state(true);
	let error = $state('');

	let editing = $state(false);
	let editTitle = $state('');
	let editContent = $state('');
	let editChatUrl = $state('');
	let editTagIds = $state<number[]>([]);
	let saving = $state(false);

	async function load() {
		loading = true;
		error = '';
		try {
			entry = await logEntriesApi.getById(logId);
			editTitle = entry.Title ?? '';
			editContent = entry.Content;
			editChatUrl = entry.ChatURL ?? '';
			editTagIds = entry.Tags.map((t) => t.TagId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load log entry.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function saveEdit() {
		if (!entry) return;
		saving = true;
		error = '';
		try {
			await logEntriesApi.update(logId, {
				Title: editTitle || undefined,
				Content: editContent
			});

			if (editChatUrl !== (entry.ChatURL ?? '')) {
				await logEntriesApi.updateChatUrl(logId, editChatUrl);
			}

			const currentTagIds = entry.Tags.map((t) => t.TagId);
			const toAdd = editTagIds.filter((id) => !currentTagIds.includes(id));
			const toRemove = currentTagIds.filter((id) => !editTagIds.includes(id));
			if (toAdd.length) await logEntriesApi.addTags(logId, toAdd);
			if (toRemove.length) await logEntriesApi.removeTags(logId, toRemove);

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

	async function deleteEntry() {
		if (!entry) return;
		if (!confirm('Delete this log entry?')) return;
		try {
			await logEntriesApi.delete(logId);
			goto(`/nodes/${entry.NodeId}`);
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to delete entry.';
		}
	}
</script>

<div class="container">
	{#if entry}
		<div class="breadcrumb"><a href="/nodes/{entry.NodeId}">Back to node</a></div>
	{/if}

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if entry}
		<div class="row-between">
			{#if editing}
				<input type="text" placeholder="Title (optional)" bind:value={editTitle} style="font-size: 1.4rem; font-weight: 600;" />
			{:else}
				<h1>{entry.Title || comicTitle(entry.LogId)}</h1>
			{/if}
			<span class="muted">{new Date(entry.EntryDate).toLocaleString()}</span>
		</div>

		{#if !editing && !entry.Title}
			<p class="muted entry-byline">{comicByline(entry.LogId)}</p>
		{/if}

		{#if !editing}
			<div class="row" style="margin-bottom: 1rem; flex-wrap: wrap;">
				{#each entry.Tags as tag (tag.TagId)}
					<span class="tag-pill">{tag.Name}</span>
				{/each}
			</div>
			{#if entry.ChatURL}
				<p><a href={entry.ChatURL} target="_blank" rel="noopener">Related chat ↗</a></p>
			{/if}
		{/if}

		<TiptapEditor bind:value={editContent} editable={editing} onImageUpload={uploadImage} />

		{#if editing}
			<div class="field" style="margin-top: 1rem;">
				<label for="tags">Tags</label>
				<TagPicker bind:selectedIds={editTagIds} />
			</div>
			<div class="field">
				<label for="chat-url">Chat URL</label>
				<input id="chat-url" type="url" bind:value={editChatUrl} placeholder="https://..." />
			</div>
			<div class="row">
				<button class="primary" onclick={saveEdit} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</button>
				<button onclick={() => { editing = false; editContent = entry!.Content; }}>Cancel</button>
			</div>
		{:else}
			<div class="row" style="margin-top: 1rem;">
				<button onclick={() => (editing = true)} disabled={auth.isDemo}>Edit</button>
				<button class="danger" onclick={deleteEntry} disabled={auth.isDemo}>Delete</button>
			</div>
			{#if auth.isDemo}
				<p class="muted">Editing and deleting are disabled in demo mode.</p>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.entry-byline {
		margin-top: -0.5rem;
	}
	@media (max-width: 640px) {
		.entry-byline {
			margin-top: 0.35rem;
		}
	}
</style>
