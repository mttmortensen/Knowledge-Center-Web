<script lang="ts" module>
	import type { ActionItem } from '$lib/types/api';
	import { sortRows, type SortColumn, type SortState, type SortValue } from '$lib/utils/tableSort';

	export type ActionRow = ActionItem & { KnowledgeNodeTitle?: string };

	export const defaultActionSort: SortState = { key: 'date', dir: 'desc' };

	/** Sorting by status descending puts Open above Closed. */
	export const openFirstActionSort: SortState = { key: 'status', dir: 'desc' };

	export function actionSortColumns(showNode: boolean): SortColumn[] {
		return [
			{ key: 'action', label: 'Action' },
			...(showNode ? [{ key: 'node', label: 'Knowledge Node' }] : []),
			{ key: 'status', label: 'Status' },
			{ key: 'date', label: 'Date', dir: 'desc' as const }
		];
	}

	function actionSortValue(action: ActionRow, key: string): SortValue {
		switch (key) {
			case 'action':
				return action.ActionText;
			case 'node':
				return action.KnowledgeNodeTitle ?? '';
			case 'status':
				return action.Status;
			default:
				return new Date(action.CompletedAt ?? action.CreatedAt).getTime();
		}
	}

	/** Exported so a paginated page can sort the full list before slicing it. */
	export function sortActions(actions: ActionRow[], sort: SortState): ActionRow[] {
		return sortRows(actions, sort, actionSortValue);
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import SortHeader from './SortHeader.svelte';
	import TableSortBar from './TableSortBar.svelte';
	import { ariaSort } from '$lib/utils/tableSort';

	let {
		actions,
		showNode = false,
		sort = $bindable(defaultActionSort)
	}: { actions: ActionRow[]; showNode?: boolean; sort?: SortState } = $props();

	const rows = $derived(sortActions(actions, sort));

	function statusLabel(status: string): string {
		return status === 'Completed' ? 'Closed' : status;
	}
</script>

<!-- container-type here so the tables below switch to their card layout
     on the width of their container, not the viewport — ActionTable also lives
     in the dashboard's narrow sidebar card. -->
<div class="table-wrap">
	<TableSortBar columns={actionSortColumns(showNode)} bind:sort />

	<table class="action-table">
		<thead>
			<tr>
				<th class="col-action" aria-sort={ariaSort(sort, 'action')}>
					<SortHeader label="Action" sortKey="action" bind:sort />
				</th>
				{#if showNode}
					<th class="col-node" aria-sort={ariaSort(sort, 'node')}>
						<SortHeader label="Knowledge Node" sortKey="node" bind:sort />
					</th>
				{/if}
				<th class="col-status" aria-sort={ariaSort(sort, 'status')}>
					<SortHeader label="Status" sortKey="status" bind:sort />
				</th>
				<th class="col-date" aria-sort={ariaSort(sort, 'date')}>
					<SortHeader label="Date" sortKey="date" dir="desc" align="right" bind:sort />
				</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as action (action.Id)}
				<tr onclick={() => goto(`/actions/${action.Id}`)}>
					<td class="col-action">
						<a href="/actions/{action.Id}">{action.ActionText}</a>
					</td>
					{#if showNode}
						<td class="col-node" data-label="Knowledge Node">
							<a
								href="/nodes/{action.KnowledgeNodeId}"
								onclick={(e) => e.stopPropagation()}
								class="muted">{action.KnowledgeNodeTitle}</a
							>
						</td>
					{/if}
					<td class="col-status" data-label="Status">
						<span
							class="tag-pill"
							class:open={action.Status === 'Open'}
							class:completed={action.Status === 'Completed'}
						>
							{statusLabel(action.Status)}
						</span>
					</td>
					<td class="col-date muted" data-label="Date">
						{new Date(action.CompletedAt ?? action.CreatedAt).toLocaleDateString()}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		container: kc-table / inline-size;
	}
	.action-table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}
	.action-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		/* No padding: the SortHeader button inside fills the cell and carries it. */
		padding: 0;
		border-bottom: 1px solid var(--border);
	}
	.action-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	.action-table tbody tr {
		cursor: pointer;
	}
	.action-table tbody tr:hover {
		background: var(--bg-hover);
	}
	/* col-action has no explicit width: with table-layout:fixed, it's the only
	   column without one, so it absorbs whatever space the others don't claim. */
	.col-action a {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text);
	}
	.col-action a:hover {
		text-decoration: none;
	}
	.col-node {
		width: 160px;
	}
	.col-node a {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.col-status {
		width: 110px;
	}
	.col-date {
		width: 90px;
		white-space: nowrap;
		text-align: right;
	}

	@container kc-table (max-width: 640px) {
		.action-table thead {
			display: none;
		}
		.action-table,
		.action-table tbody,
		.action-table tr,
		.action-table td {
			display: block;
			width: 100%;
		}
		.action-table tr {
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 0.75rem 0.85rem;
			margin-bottom: 0.6rem;
		}
		.action-table td {
			border-bottom: none;
			padding: 0.3rem 0;
		}
		.col-action {
			padding-bottom: 0.5rem !important;
			border-bottom: 1px solid var(--border) !important;
			margin-bottom: 0.35rem;
		}
		.col-action a {
			white-space: normal;
			overflow: visible;
			font-weight: 600;
		}
		.action-table td:not(.col-action) {
			display: flex;
			align-items: center;
			justify-content: space-between;
			text-align: left;
			gap: 0.75rem;
		}
		.col-node {
			/* Flex items don't shrink below their content's min-content width by
			   default — without this, a long nowrap node title (from the desktop
			   ellipsis rule) forces the whole card, and the grid track it sits
			   in, wider than the viewport. */
			min-width: 0;
		}
		.col-node a {
			white-space: normal;
			overflow: visible;
			text-align: right;
		}
		.action-table td::before {
			content: attr(data-label);
			font-size: 0.75rem;
			color: var(--text-muted);
			font-weight: 600;
			flex-shrink: 0;
		}
	}
</style>
