<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { uploadImage } from '$lib/api/images';

	const nodeId = $derived(Number(page.params.id));

	let title = $state('');
	let content = $state('');
	let contributesToProgress = $state(true);
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
				ContributesToProgress: contributesToProgress,
				ChatURL: chatUrl || undefined
			});
			goto(`/nodes/${nodeId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create log entry.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href="/nodes/{nodeId}">Back to node</a></div>
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

		<div class="field row">
			<input id="progress" type="checkbox" style="width: auto;" bind:checked={contributesToProgress} />
			<label for="progress" style="margin: 0;">Counts toward progress</label>
		</div>

		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Saving…' : 'Create entry'}
		</button>
	</form>
</div>
