<script lang="ts">
	import { toggleSort, type SortDirection, type SortState } from '$lib/utils/tableSort';

	let {
		label,
		sortKey,
		sort = $bindable(),
		dir = 'asc',
		align = 'left'
	}: {
		label: string;
		sortKey: string;
		sort: SortState;
		/** Direction applied the first time this column is picked. */
		dir?: SortDirection;
		align?: 'left' | 'right';
	} = $props();

	const active = $derived(sort.key === sortKey);
</script>

<button
	type="button"
	class="sort-header"
	class:active
	class:right={align === 'right'}
	onclick={() => (sort = toggleSort(sort, sortKey, dir))}
>
	<span class="label">{label}</span>
	<span class="arrow" aria-hidden="true">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
</button>

<style>
	/* Fills the th so the whole header cell is the hit target — the tables set
	   `th { padding: 0 }` and let this button carry the cell padding. */
	.sort-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		width: 100%;
		background: none;
		border: none;
		border-radius: 0;
		padding: 0.4rem 0.75rem;
		font-weight: inherit;
		text-align: left;
	}
	.sort-header.right {
		justify-content: flex-end;
	}
	.sort-header:hover:not(:disabled) {
		background: var(--bg-hover);
		color: var(--text);
	}
	.sort-header.active {
		color: var(--text);
	}
	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* Reserved even when idle so picking a column doesn't shift the header text. */
	.arrow {
		font-size: 0.65em;
		opacity: 0;
		flex-shrink: 0;
	}
	.sort-header:hover .arrow,
	.sort-header.active .arrow {
		opacity: 1;
	}
	.sort-header.active .arrow {
		color: var(--accent);
	}
</style>
