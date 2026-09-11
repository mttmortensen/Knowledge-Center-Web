<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { uploadImage } from '$lib/api/images';

	const nodeId = $derived(Number(page.params.id));
	const backHref = $derived(
		page.url.searchParams.get('domain')
			? `/domains?domain=${page.url.searchParams.get('domain')}&node=${nodeId}`
			: `/nodes/${nodeId}`
	);

	let title = $state('');
	let content = $state('');
	let chatUrl = $state('');
	let tagIds = $state<number[]>([]);
	let saving = $state(false);
	let error = $state('');

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!content.trim()) {
			error = 'Entry content cannot be empty.';
			return;
		}
		saving = true;
		error = '';
		try {
			const created = await logEntriesApi.create({
				NodeId: nodeId,
				Title: title || undefined,
				Content: content,
				TagIds: tagIds,
				ChatURL: chatUrl || undefined
			});
			const domainId = page.url.searchParams.get('domain');
			if (domainId) {
				goto(`/domains?domain=${domainId}&node=${nodeId}&log=${created.LogId}`);
			} else {
				goto(`/nodes/${nodeId}`);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create log entry.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href={backHref}>Back</a></div>
	<h1>New Log Entry</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<form onsubmit={save}>
		<div class="field">
			<label for="title">Title (optional)</label>
			<input id="title" type="text" bind:value={title} />
		</div>

		<div class="field">
			<label for="content">Content</label>
			<TiptapEditor bind:value={content} onImageUpload={uploadImage} />
		</div>

		<div class="field">
			<label for="tags">Tags</label>
			<TagPicker bind:selectedIds={tagIds} />
		</div>

		<div class="field">
			<label for="chat-url">Chat URL (optional)</label>
			<input id="chat-url" type="url" bind:value={chatUrl} placeholder="https://..." />
		</div>

		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Saving…' : 'Create entry'}
		</button>
	</form>
</div>
