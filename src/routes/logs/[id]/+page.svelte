<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { loadParentContext, type ParentContext } from '$lib/api/parents';
	import { uploadImage } from '$lib/api/images';
	import type { LogEntry } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { DemoForbiddenError } from '$lib/api/client';
	import { comicTitle, comicByline } from '$lib/utils/comicTitle';

	const logId = $derived(Number(page.params.id));

	let entry = $state<LogEntry | null>(null);
	let parent = $state<ParentContext>({ node: null, domain: null });
	let loading = $state(true);
	let error = $state('');

	let editing = $state(false);
	let editTitle = $state('');
	let editContent = $state('');
	let editTagIds = $state<number[]>([]);
	let saving = $state(false);

	const metaRows: MetaRow[] = $derived.by(() => {
		if (!entry) return [];
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
				value: node?.Title ?? `Node ${entry.NodeId}`,
				href: `/nodes/${entry.NodeId}`
			},
			{
				label: 'Node type',
				value: node ? `${node.NodeType} · ${node.Status}` : null
			},
			{ label: 'Entry date', value: new Date(entry.EntryDate).toLocaleString() },
			{
				label: 'Title',
				value: entry.Title ? null : 'Untitled — display name is generated'
			},
			{ label: 'Tags', pills: entry.Tags.map((t) => t.Name) },
			{ label: 'Log ID', value: `#${entry.LogId}` }
		];
	});

	async function load() {
		loading = true;
		error = '';
		try {
			entry = await logEntriesApi.getById(logId);
			editTitle = entry.Title ?? '';
			editContent = entry.Content;
			editTagIds = entry.Tags.map((t) => t.TagId);
			parent = await loadParentContext(entry.NodeId);
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
		<div class="breadcrumb">
			<a href="/domains">Domains</a> /
			{#if parent.node}
				<a href="/domains/{parent.node.DomainId}">{parent.domain?.DomainName ?? 'Domain'}</a> /
			{/if}
			<a href="/nodes/{entry.NodeId}">{parent.node?.Title ?? 'Node'}</a> / Log
		</div>
	{/if}

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if entry}
		<div class="row-between">
			{#if editing}
				<input
					type="text"
					placeholder="Title (optional)"
					bind:value={editTitle}
					style="font-size: 1.4rem; font-weight: 600;"
				/>
			{:else}
				<h1>{entry.Title || comicTitle(entry.LogId)}</h1>
			{/if}
		</div>

		{#if !editing && !entry.Title}
			<p class="muted entry-byline">{comicByline(entry.LogId)}</p>
		{/if}

		<h2 class="section-heading">Details</h2>
		<div class="card meta-card">
			<MetaPanel rows={metaRows} />
		</div>

		<h2 class="section-heading">Entry content</h2>
		<TiptapEditor bind:value={editContent} editable={editing} onImageUpload={uploadImage} />

		{#if editing}
			<div class="field" style="margin-top: 1rem;">
				<label for="tags">Tags</label>
				<TagPicker bind:selectedIds={editTagIds} />
			</div>
			<div class="row">
				<button class="primary" onclick={saveEdit} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</button>
				<button
					onclick={() => {
						editing = false;
						editContent = entry!.Content;
					}}>Cancel</button
				>
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
