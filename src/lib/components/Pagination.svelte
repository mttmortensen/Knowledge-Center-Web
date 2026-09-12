<script lang="ts">
	let {
		page = $bindable(1),
		totalPages,
		totalItems,
		itemLabel = 'items'
	}: {
		page: number;
		totalPages: number;
		totalItems: number;
		itemLabel?: string;
	} = $props();
</script>

{#if totalPages > 1}
	<div class="pager">
		<span class="muted">Page {page} of {totalPages} · {totalItems} {itemLabel}</span>
		<div class="pager-buttons">
			<button type="button" onclick={() => (page = Math.max(1, page - 1))} disabled={page === 1}>
				Previous
			</button>
			<button
				type="button"
				onclick={() => (page = Math.min(totalPages, page + 1))}
				disabled={page === totalPages}
			>
				Next
			</button>
		</div>
	</div>
{/if}

<style>
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0.75rem 0.75rem 0;
		font-size: 0.85rem;
	}
	.pager-buttons {
		display: flex;
		gap: 0.5rem;
	}
	.pager-buttons button {
		padding: 0.35rem 0.75rem;
		font-size: 0.85rem;
	}
</style>
