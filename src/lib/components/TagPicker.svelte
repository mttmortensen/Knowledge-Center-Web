<script lang="ts">
	import { onMount } from 'svelte';
	import { tagsApi } from '$lib/api/tags';
	import { matchesQuery } from '$lib/utils/tableFilter';
	import type { Tag } from '$lib/types/api';

	let { selectedIds = $bindable([]) }: { selectedIds: number[] } = $props();

	let allTags = $state<Tag[]>([]);
	let newTagName = $state('');
	let creating = $state(false);
	let error = $state('');
	let expanded = $state(false);
	let search = $state('');

	const COLLAPSED_LIMIT = 10;

	// Collapsed, the picker shows the first few tags plus any selected ones past
	// the cutoff, so a selection never hides. Expanded, it shows every tag that
	// matches the search box.
	const visibleTags = $derived.by(() => {
		if (expanded) return allTags.filter((tag) => matchesQuery(search, tag.Name));
		return allTags.filter(
			(tag, index) => index < COLLAPSED_LIMIT || selectedIds.includes(tag.TagId)
		);
	});
	const hiddenCount = $derived(allTags.length - visibleTags.length);

	function setExpanded(value: boolean) {
		expanded = value;
		search = '';
	}

	onMount(async () => {
		try {
			allTags = await tagsApi.getAll();
		} catch {
			error = 'Failed to load tags.';
		}
	});

	function toggle(id: number) {
		selectedIds = selectedIds.includes(id)
			? selectedIds.filter((existing) => existing !== id)
			: [...selectedIds, id];
	}

	async function createTag() {
		if (!newTagName.trim()) return;
		creating = true;
		error = '';
		try {
			const tag = await tagsApi.create(newTagName.trim());
			allTags = [...allTags, tag];
			selectedIds = [...selectedIds, tag.TagId];
			newTagName = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create tag.';
		} finally {
			creating = false;
		}
	}
</script>

<div>
	{#if error}
		<p class="muted">{error}</p>
	{/if}
	{#if expanded}
		<input
			class="tag-search"
			type="text"
			placeholder="Search tags…"
			aria-label="Search tags"
			bind:value={search}
			onkeydown={(e) => e.key === 'Enter' && e.preventDefault()}
		/>
	{/if}
	<div class="row" style="flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;">
		{#each visibleTags as tag (tag.TagId)}
			<button
				type="button"
				class:selected={selectedIds.includes(tag.TagId)}
				onclick={() => toggle(tag.TagId)}
			>
				{tag.Name}
			</button>
		{/each}
		{#if expanded}
			{#if visibleTags.length === 0}
				<span class="muted">No tags match "{search.trim()}".</span>
			{/if}
			{#if allTags.length > COLLAPSED_LIMIT}
				<button type="button" class="toggle" onclick={() => setExpanded(false)}>Show less</button>
			{/if}
		{:else if hiddenCount > 0}
			<button type="button" class="toggle" onclick={() => setExpanded(true)}>
				View all ({allTags.length})
			</button>
		{/if}
	</div>
	<div class="row new-tag">
		<input
			type="text"
			placeholder="New tag name"
			bind:value={newTagName}
			onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), createTag())}
		/>
		<button type="button" onclick={createTag} disabled={creating}>Add tag</button>
	</div>
</div>

<style>
	button.selected {
		background: var(--accent);
		border-color: var(--accent);
		color: #0b0d12;
	}

	button.toggle {
		background: transparent;
		border-style: dashed;
	}

	.tag-search {
		margin-bottom: 0.6rem;
	}

	.new-tag input {
		flex: 0 1 16rem;
		min-width: 0;
	}

	.new-tag button {
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
