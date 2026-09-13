<script lang="ts" module>
	import type { Domain } from '$lib/types/api';
	import { sortRows, type SortColumn, type SortState, type SortValue } from '$lib/utils/tableSort';

	export const domainSortColumns: SortColumn[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'description', label: 'Description' },
		{ key: 'nodes', label: 'Nodes', dir: 'desc' },
		{ key: 'status', label: 'Status' },
		{ key: 'updated', label: 'Updated', dir: 'desc' }
	];

	export const defaultDomainSort: SortState = { key: 'name', dir: 'asc' };

	function domainSortValue(
		domain: Domain,
		key: string,
		nodeCounts: Map<number, number>
	): SortValue {
		switch (key) {
			case 'name':
				return domain.DomainName;
			case 'description':
				return domain.DomainDescription;
			case 'nodes':
				return nodeCounts.get(domain.DomainId) ?? 0;
			case 'status':
				return domain.DomainStatus;
			default:
				return new Date(domain.LastUpdated).getTime();
		}
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import SortHeader from './SortHeader.svelte';
	import TableSortBar from './TableSortBar.svelte';
	import { ariaSort } from '$lib/utils/tableSort';

	let {
		domains,
		nodeCounts,
		sort = $bindable(defaultDomainSort)
	}: { domains: Domain[]; nodeCounts: Map<number, number>; sort?: SortState } = $props();

	const rows = $derived(
		sortRows(domains, sort, (domain, key) => domainSortValue(domain, key, nodeCounts))
	);
</script>

<!-- container-type here so the tables below switch to their card layout
     on the width of their container, not the viewport — ActionTable also lives
     in the dashboard's narrow sidebar card. -->
<div class="table-wrap">
	<TableSortBar columns={domainSortColumns} bind:sort />

	<table class="domain-table">
		<thead>
			<tr>
				<th class="col-name" aria-sort={ariaSort(sort, 'name')}>
					<SortHeader label="Name" sortKey="name" bind:sort />
				</th>
				<th class="col-description" aria-sort={ariaSort(sort, 'description')}>
					<SortHeader label="Description" sortKey="description" bind:sort />
				</th>
				<th class="col-count" aria-sort={ariaSort(sort, 'nodes')}>
					<SortHeader label="Nodes" sortKey="nodes" dir="desc" align="right" bind:sort />
				</th>
				<th class="col-status" aria-sort={ariaSort(sort, 'status')}>
					<SortHeader label="Status" sortKey="status" bind:sort />
				</th>
				<th class="col-date" aria-sort={ariaSort(sort, 'updated')}>
					<SortHeader label="Updated" sortKey="updated" dir="desc" align="right" bind:sort />
				</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as domain (domain.DomainId)}
				<tr onclick={() => goto(`/domains/${domain.DomainId}`)}>
					<td class="col-name">
						<a href="/domains/{domain.DomainId}">{domain.DomainName}</a>
					</td>
					<td class="col-description muted" data-label="Description">{domain.DomainDescription}</td>
					<td class="col-count muted" data-label="Knowledge Nodes"
						>{nodeCounts.get(domain.DomainId) ?? 0}</td
					>
					<td class="col-status" data-label="Status"
						><span class="tag-pill">{domain.DomainStatus}</span></td
					>
					<td class="col-date muted" data-label="Updated"
						>{new Date(domain.LastUpdated).toLocaleDateString()}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		container: kc-table / inline-size;
	}
	.domain-table {
		width: 100%;
		border-collapse: collapse;
	}
	.domain-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		/* No padding: the SortHeader button inside fills the cell and carries it. */
		padding: 0;
		border-bottom: 1px solid var(--border);
	}
	.domain-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	.domain-table tbody tr {
		cursor: pointer;
	}
	.domain-table tbody tr:hover {
		background: var(--bg-hover);
	}
	.col-name {
		width: 30%;
		max-width: 0;
	}
	.col-name a {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text);
	}
	.col-name a:hover {
		text-decoration: none;
	}
	.col-description {
		width: 50%;
		max-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.col-count {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}
	.col-status {
		width: 1%;
		white-space: nowrap;
	}
	.col-date {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}

	@container kc-table (max-width: 640px) {
		.domain-table thead {
			display: none;
		}
		.domain-table,
		.domain-table tbody,
		.domain-table tr,
		.domain-table td {
			display: block;
			width: 100%;
		}
		.domain-table tr {
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 0.75rem 0.85rem;
			margin-bottom: 0.6rem;
		}
		.domain-table td {
			border-bottom: none;
			padding: 0.3rem 0;
		}
		.col-name {
			max-width: none;
			padding-bottom: 0.5rem !important;
			border-bottom: 1px solid var(--border) !important;
			margin-bottom: 0.35rem;
		}
		.col-name a {
			white-space: normal;
			overflow: visible;
			font-weight: 600;
		}
		.col-description {
			max-width: none;
			overflow: visible;
			white-space: normal;
		}
		.domain-table td:not(.col-name) {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			text-align: left;
			gap: 0.75rem;
		}
		.domain-table td::before {
			content: attr(data-label);
			font-size: 0.75rem;
			color: var(--text-muted);
			font-weight: 600;
			flex-shrink: 0;
		}
	}
</style>
