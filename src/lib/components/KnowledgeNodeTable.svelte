<script lang="ts" module>
	import type { KnowledgeNodeInline } from '$lib/types/api';
	import { sortRows, type SortColumn, type SortState, type SortValue } from '$lib/utils/tableSort';

	export const nodeSortColumns: SortColumn[] = [
		{ key: 'title', label: 'Title' },
		{ key: 'type', label: 'Type' },
		{ key: 'logs', label: 'Logs', dir: 'desc' },
		{ key: 'actions', label: 'Actions', dir: 'desc' },
		{ key: 'confidence', label: 'Confidence', dir: 'desc' },
		{ key: 'status', label: 'Status' },
		{ key: 'updated', label: 'Updated', dir: 'desc' }
	];

	export const defaultNodeSort: SortState = { key: 'title', dir: 'asc' };

	type Counts = { logs: Map<number, number>; actions: Map<number, number> };

	function nodeSortValue(node: KnowledgeNodeInline, key: string, counts: Counts): SortValue {
		switch (key) {
			case 'title':
				return node.Title;
			case 'type':
				return node.NodeType;
			case 'logs':
				return counts.logs.get(node.Id) ?? 0;
			case 'actions':
				return counts.actions.get(node.Id) ?? 0;
			case 'confidence':
				return node.ConfidenceLevel;
			case 'status':
				return node.Status;
			default:
				return new Date(node.LastUpdated).getTime();
		}
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import SortHeader from './SortHeader.svelte';
	import TableSortBar from './TableSortBar.svelte';
	import { ariaSort } from '$lib/utils/tableSort';

	let {
		nodes,
		logCounts,
		actionCounts,
		sort = $bindable(defaultNodeSort)
	}: {
		nodes: KnowledgeNodeInline[];
		logCounts: Map<number, number>;
		actionCounts: Map<number, number>;
		sort?: SortState;
	} = $props();

	const rows = $derived(
		sortRows(nodes, sort, (node, key) =>
			nodeSortValue(node, key, { logs: logCounts, actions: actionCounts })
		)
	);
</script>

<!-- container-type here so the tables below switch to their card layout
     on the width of their container, not the viewport — ActionTable also lives
     in the dashboard's narrow sidebar card. -->
<div class="table-wrap">
	<TableSortBar columns={nodeSortColumns} bind:sort />

	<table class="node-table">
		<thead>
			<tr>
				<th class="col-title" aria-sort={ariaSort(sort, 'title')}>
					<SortHeader label="Title" sortKey="title" bind:sort />
				</th>
				<th class="col-type" aria-sort={ariaSort(sort, 'type')}>
					<SortHeader label="Type" sortKey="type" bind:sort />
				</th>
				<th class="col-count" aria-sort={ariaSort(sort, 'logs')}>
					<SortHeader label="Logs" sortKey="logs" dir="desc" align="right" bind:sort />
				</th>
				<th class="col-count" aria-sort={ariaSort(sort, 'actions')}>
					<SortHeader label="Actions" sortKey="actions" dir="desc" align="right" bind:sort />
				</th>
				<th class="col-confidence" aria-sort={ariaSort(sort, 'confidence')}>
					<SortHeader label="Confidence" sortKey="confidence" dir="desc" bind:sort />
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
			{#each rows as node (node.Id)}
				<tr onclick={() => goto(`/nodes/${node.Id}`)}>
					<td class="col-title">
						<a href="/nodes/{node.Id}">{node.Title}</a>
					</td>
					<td class="col-type muted" data-label="Type">{node.NodeType}</td>
					<td class="col-count muted" data-label="Logs">{logCounts.get(node.Id) ?? 0}</td>
					<td class="col-count muted" data-label="Actions">{actionCounts.get(node.Id) ?? 0}</td>
					<td class="col-confidence muted" data-label="Confidence">{node.ConfidenceLevel}/5</td>
					<td class="col-status" data-label="Status"><span class="tag-pill">{node.Status}</span></td>
					<td class="col-date muted" data-label="Updated"
						>{new Date(node.LastUpdated).toLocaleDateString()}</td
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
	.node-table {
		width: 100%;
		border-collapse: collapse;
	}
	.node-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		/* No padding: the SortHeader button inside fills the cell and carries it. */
		padding: 0;
		border-bottom: 1px solid var(--border);
	}
	.node-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	.node-table tbody tr {
		cursor: pointer;
	}
	.node-table tbody tr:hover {
		background: var(--bg-hover);
	}
	.col-title {
		width: 40%;
		max-width: 0;
	}
	.col-title a {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text);
	}
	.col-title a:hover {
		text-decoration: none;
	}
	.col-type {
		width: 20%;
	}
	.col-count {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}
	.col-confidence {
		width: 1%;
		white-space: nowrap;
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
		.node-table thead {
			display: none;
		}
		.node-table,
		.node-table tbody,
		.node-table tr,
		.node-table td {
			display: block;
			width: 100%;
		}
		.node-table tr {
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 0.75rem 0.85rem;
			margin-bottom: 0.6rem;
		}
		.node-table td {
			border-bottom: none;
			padding: 0.3rem 0;
		}
		.col-title {
			max-width: none;
			padding-bottom: 0.5rem !important;
			border-bottom: 1px solid var(--border) !important;
			margin-bottom: 0.35rem;
		}
		.col-title a {
			white-space: normal;
			overflow: visible;
			font-weight: 600;
		}
		.node-table td:not(.col-title) {
			display: flex;
			align-items: center;
			justify-content: space-between;
			text-align: left;
			gap: 0.75rem;
		}
		.node-table td::before {
			content: attr(data-label);
			font-size: 0.75rem;
			color: var(--text-muted);
			font-weight: 600;
			flex-shrink: 0;
		}
	}
</style>
