<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import MetaPanel, { type MetaRow } from '$lib/components/MetaPanel.svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { loadParentContext, type ParentContext } from '$lib/api/parents';
	import { uploadImage } from '$lib/api/images';
	import { onMount } from 'svelte';

	const nodeId = $derived(Number(page.params.id));

	let parent = $state<ParentContext>({ node: null, domain: null });

	const metaRows: MetaRow[] = $derived.by(() => {
		const node = parent.node;
		return [
			{
				label: 'Domain',
				value: parent.domain?.DomainName ?? (node ? `Domain ${node.DomainId}` : null),
				href: node ? `/domains/${node.DomainId}` : undefined
			},
			{
				label: 'Knowledge node',
				value: node?.Title ?? `Node ${nodeId}`,
				href: `/nodes/${nodeId}`
			},
			{ label: 'Node type', value: node ? `${node.NodeType} · ${node.Status}` : null }
		];
	});

	onMount(async () => {
		parent = await loadParentContext(nodeId);
	});

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
			goto(`/nodes/${nodeId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create log entry.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb">
		<a href="/domains">Domains</a> /
		{#if parent.node}
			<a href="/domains/{parent.node.DomainId}">{parent.domain?.DomainName ?? 'Domain'}</a> /
		{/if}
		<a href="/nodes/{nodeId}">{parent.node?.Title ?? 'Node'}</a> / New log
	</div>
	<h1>New Log Entry</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<h2 class="section-heading">Filed under</h2>
	<div class="card meta-card">
		<MetaPanel rows={metaRows} />
	</div>

	<h2 class="section-heading">Entry content</h2>

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
