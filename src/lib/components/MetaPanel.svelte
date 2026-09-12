<script lang="ts" module>
	export interface MetaRow {
		label: string;
		value?: string | null;
		href?: string;
		external?: boolean;
		pill?: 'default' | 'open' | 'completed';
		pills?: string[];
	}
</script>

<script lang="ts">
	let { rows }: { rows: MetaRow[] } = $props();

	const visible = $derived(
		rows.filter((row) => (row.pills?.length ?? 0) > 0 || (row.value != null && row.value !== ''))
	);
</script>

<dl class="meta-grid">
	{#each visible as row (row.label)}
		<dt>{row.label}</dt>
		<dd>
			{#if row.pills?.length}
				<span class="pill-row">
					{#each row.pills as pill (pill)}
						<span class="tag-pill">{pill}</span>
					{/each}
				</span>
			{:else if row.href}
				<a
					href={row.href}
					target={row.external ? '_blank' : undefined}
					rel={row.external ? 'noopener' : undefined}
				>
					{row.value}{row.external ? ' ↗' : ''}
				</a>
			{:else if row.pill}
				<span
					class="tag-pill"
					class:open={row.pill === 'open'}
					class:completed={row.pill === 'completed'}
				>
					{row.value}
				</span>
			{:else}
				<span>{row.value}</span>
			{/if}
		</dd>
	{/each}
</dl>

<style>
	.meta-grid {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 0.55rem 1.25rem;
		align-items: baseline;
		margin: 0;
	}
	dt {
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-muted);
		white-space: nowrap;
	}
	dd {
		margin: 0;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	@media (max-width: 520px) {
		.meta-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.15rem;
		}
		dd:not(:last-child) {
			margin-bottom: 0.6rem;
		}
	}
</style>
