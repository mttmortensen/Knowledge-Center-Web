<script lang="ts">
	import { ANY, type FilterSelect } from '$lib/utils/tableFilter';

	let {
		search = $bindable(''),
		values = $bindable({}),
		selects = [],
		placeholder = 'Search…',
		searchLabel = 'Search',
		shown,
		total,
		itemLabel = 'items'
	}: {
		search?: string;
		/** Select key -> chosen value. The page owns it; this mutates it in place. */
		values?: Record<string, string>;
		selects?: FilterSelect[];
		placeholder?: string;
		searchLabel?: string;
		/** Row counts for the summary line. Omit to hide it. */
		shown?: number;
		total?: number;
		itemLabel?: string;
	} = $props();

	const active = $derived(
		search.trim() !== '' || selects.some((select) => (values[select.key] ?? ANY) !== ANY)
	);

	function clear() {
		search = '';
		for (const select of selects) values[select.key] = ANY;
	}
</script>

<div class="filter-bar">
	<div class="filter-row">
		<input
			class="filter-search"
			type="text"
			{placeholder}
			aria-label={searchLabel}
			bind:value={search}
		/>
		{#each selects as select (select.key)}
			<select
				class="filter-select"
				aria-label={select.label}
				value={values[select.key] ?? ANY}
				onchange={(e) => (values[select.key] = e.currentTarget.value)}
			>
				<option value={ANY}>{select.allLabel ?? `All ${select.label.toLowerCase()}`}</option>
				{#each select.options as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		{/each}
		<button type="button" onclick={clear} disabled={!active}>Clear</button>
	</div>
	{#if active && shown !== undefined && total !== undefined}
		<p class="filter-count muted">Showing {shown} of {total} {itemLabel}</p>
	{/if}
</div>

<style>
	.filter-bar {
		margin-bottom: 1.25rem;
	}
	.filter-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	/* The text box takes the slack; the dropdowns stay at their content width
				until the row wraps, then each takes a full line. */
	.filter-search {
		flex: 1 1 14rem;
		min-width: 0;
	}
	.filter-select {
		flex: 0 1 auto;
		width: auto;
		min-width: 9rem;
	}
	.filter-row button {
		padding: 0.5rem 0.8rem;
	}
	.filter-count {
		margin: 0.5rem 0 0;
	}

	@media (max-width: 560px) {
		.filter-search,
		.filter-select,
		.filter-row button {
			flex: 1 1 100%;
			width: 100%;
		}
	}
</style>
