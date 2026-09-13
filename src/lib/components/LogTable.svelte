<script lang="ts" module>
	import type { LogEntry } from '$lib/types/api';
	import { comicTitle } from '$lib/utils/comicTitle';
	import { sortRows, type SortColumn, type SortState, type SortValue } from '$lib/utils/tableSort';

	export const logSortColumns: SortColumn[] = [
		{ key: 'entry', label: 'Entry' },
		{ key: 'tags', label: 'Tags' },
		{ key: 'date', label: 'Date', dir: 'desc' }
	];

	export const defaultLogSort: SortState = { key: 'date', dir: 'desc' };

	function preview(content: string): string {
		const plain = content.replace(/[#*_`>-]/g, '').trim();
		return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
	}

	function entryLabel(log: LogEntry): string {
		return log.Title || preview(log.Content) || comicTitle(log.LogId);
	}

	function logSortValue(log: LogEntry, key: string): SortValue {
		switch (key) {
			case 'entry':
				return entryLabel(log);
			case 'tags':
				return log.Tags.map((tag) => tag.Name).join(', ');
			default:
				return new Date(log.EntryDate).getTime();
		}
	}

	/** Exported so a paginated page can sort the full list before slicing it. */
	export function sortLogs(logs: LogEntry[], sort: SortState): LogEntry[] {
		return sortRows(logs, sort, logSortValue);
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import SortHeader from './SortHeader.svelte';
	import TableSortBar from './TableSortBar.svelte';
	import { ariaSort } from '$lib/utils/tableSort';

	let { logs, sort = $bindable(defaultLogSort) }: { logs: LogEntry[]; sort?: SortState } = $props();

	const rows = $derived(sortLogs(logs, sort));
</script>

<!-- container-type here so the tables below switch to their card layout
     on the width of their container, not the viewport — ActionTable also lives
     in the dashboard's narrow sidebar card. -->
<div class="table-wrap">
	<TableSortBar columns={logSortColumns} bind:sort />

	<table class="log-table">
		<thead>
			<tr>
				<th class="col-entry" aria-sort={ariaSort(sort, 'entry')}>
					<SortHeader label="Entry" sortKey="entry" bind:sort />
				</th>
				<th class="col-tags" aria-sort={ariaSort(sort, 'tags')}>
					<SortHeader label="Tags" sortKey="tags" bind:sort />
				</th>
				<th class="col-date" aria-sort={ariaSort(sort, 'date')}>
					<SortHeader label="Date" sortKey="date" dir="desc" align="right" bind:sort />
				</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as log (log.LogId)}
				<tr onclick={() => goto(`/logs/${log.LogId}`)}>
					<td class="col-entry">
						<a class:has-title={!!log.Title} href="/logs/{log.LogId}">{entryLabel(log)}</a>
					</td>
					<td class="col-tags" class:no-tags={log.Tags.length === 0} data-label="Tags">
						{#if log.Tags.length > 0}
							<div class="tag-row">
								{#each log.Tags as tag (tag.TagId)}
									<span class="tag-pill">{tag.Name}</span>
								{/each}
							</div>
						{/if}
					</td>
					<td class="col-date muted" data-label="Date"
						>{new Date(log.EntryDate).toLocaleDateString()}</td
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
	.log-table {
		width: 100%;
		border-collapse: collapse;
	}
	.log-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		/* No padding: the SortHeader button inside fills the cell and carries it. */
		padding: 0;
		border-bottom: 1px solid var(--border);
	}
	.log-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	.log-table tbody tr {
		cursor: pointer;
	}
	.log-table tbody tr:hover {
		background: var(--bg-hover);
	}
	.col-entry {
		width: 60%;
		max-width: 0;
	}
	.col-entry a {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text);
	}
	.col-entry a:hover {
		text-decoration: none;
	}
	.col-tags {
		width: 30%;
	}
	.tag-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.col-date {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}

	@container kc-table (max-width: 640px) {
		.log-table thead {
			display: none;
		}
		.log-table,
		.log-table tbody,
		.log-table tr,
		.log-table td {
			display: block;
			width: 100%;
		}
		.log-table tr {
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 0.75rem 0.85rem;
			margin-bottom: 0.6rem;
		}
		.log-table td {
			border-bottom: none;
			padding: 0.3rem 0;
		}
		.col-entry {
			max-width: none;
			padding-bottom: 0.5rem !important;
			border-bottom: 1px solid var(--border) !important;
			margin-bottom: 0.35rem;
		}
		.col-entry a {
			white-space: normal;
			overflow: visible;
		}
		.col-entry a.has-title {
			font-weight: 600;
		}
		.log-table td.col-tags.no-tags {
			display: none;
		}
		.log-table td:not(.col-entry) {
			display: flex;
			align-items: center;
			justify-content: space-between;
			text-align: left;
			gap: 0.75rem;
		}
		.log-table td::before {
			content: attr(data-label);
			font-size: 0.75rem;
			color: var(--text-muted);
			font-weight: 600;
			flex-shrink: 0;
		}
	}
</style>
