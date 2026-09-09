<script lang="ts">
	import { goto } from '$app/navigation';
	import type { LogEntry } from '$lib/types/api';
	import { comicTitle } from '$lib/utils/comicTitle';

	let { logs }: { logs: LogEntry[] } = $props();

	function preview(content: string): string {
		const plain = content.replace(/[#*_`>-]/g, '').trim();
		return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
	}
</script>

<table class="log-table">
	<thead>
		<tr>
			<th class="col-entry">Entry</th>
			<th class="col-tags">Tags</th>
			<th class="col-date">Date</th>
		</tr>
	</thead>
	<tbody>
		{#each logs as log (log.LogId)}
			<tr onclick={() => goto(`/logs/${log.LogId}`)}>
				<td class="col-entry">
					<a class:has-title={!!log.Title} href="/logs/{log.LogId}"
						>{log.Title || preview(log.Content) || comicTitle(log.LogId)}</a
					>
				</td>
				<td
					class="col-tags"
					class:no-tags={!(log.ContributesToProgress || log.Tags.length > 0)}
					data-label="Tags"
				>
					{#if log.ContributesToProgress || log.Tags.length > 0}
						<div class="tag-row">
							{#if log.ContributesToProgress}
								<span class="tag-pill">progress</span>
							{/if}
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

<style>
	.log-table {
		width: 100%;
		border-collapse: collapse;
	}
	.log-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		padding: 0.4rem 0.75rem;
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

	@media (max-width: 640px) {
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
