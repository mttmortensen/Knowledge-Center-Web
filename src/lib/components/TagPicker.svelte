<script lang="ts">
	import { onMount } from 'svelte';
	import { tagsApi } from '$lib/api/tags';
	import type { Tag } from '$lib/types/api';

	let { selectedIds = $bindable([]) }: { selectedIds: number[] } = $props();

	let allTags = $state<Tag[]>([]);
	let newTagName = $state('');
	let creating = $state(false);
	let error = $state('');

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
	<div class="row" style="flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;">
		{#each allTags as tag (tag.TagId)}
			<button
				type="button"
				class:selected={selectedIds.includes(tag.TagId)}
				onclick={() => toggle(tag.TagId)}
			>
				{tag.Name}
			</button>
		{/each}
	</div>
	<div class="row">
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
		color: var(--select-text);
	}
</style>
