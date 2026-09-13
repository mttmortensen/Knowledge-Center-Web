<script lang="ts">
	import type { SortColumn, SortState } from '$lib/utils/tableSort';

	let {
		columns,
		sort = $bindable()
	}: { columns: SortColumn[]; sort: SortState } = $props();

	function pick(key: string) {
		sort = { key, dir: columns.find((column) => column.key === key)?.dir ?? 'asc' };
	}
</script>

<!-- The card layout in a narrow container hides thead, so sorting gets its own
     control there. Matches the tables' @container breakpoint. -->
<div class="sort-bar">
	<span class="sort-bar-label">Sort</span>
	<select aria-label="Sort column" value={sort.key} onchange={(e) => pick(e.currentTarget.value)}>
		{#each columns as column (column.key)}
			<option value={column.key}>{column.label}</option>
		{/each}
	</select>
	<button
		type="button"
		aria-label={sort.dir === 'asc' ? 'Sort descending' : 'Sort ascending'}
		onclick={() => (sort = { key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
	>
		{sort.dir === 'asc' ? '▲' : '▼'}
	</button>
</div>

<style>
	.sort-bar {
		display: none;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}
	.sort-bar-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.sort-bar select {
		flex: 1;
		padding: 0.35rem 0.5rem;
		font-size: 0.85rem;
	}
	.sort-bar button {
		padding: 0.35rem 0.6rem;
		font-size: 0.75rem;
		line-height: 1.4;
	}

	@container kc-table (max-width: 640px) {
		.sort-bar {
			display: flex;
		}
	}
</style>
