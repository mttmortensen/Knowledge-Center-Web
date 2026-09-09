<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ActionItem } from '$lib/types/api';

	let { actions }: { actions: ActionItem[] } = $props();

	function statusLabel(status: string): string {
		return status === 'Completed' ? 'Closed' : status;
	}
</script>

<table class="action-table">
	<thead>
		<tr>
			<th class="col-action">Action</th>
			<th class="col-status">Status</th>
			<th class="col-date">Date</th>
		</tr>
	</thead>
	<tbody>
		{#each actions as action (action.Id)}
			<tr onclick={() => goto(`/actions/${action.Id}`)}>
				<td class="col-action">
					<a href="/actions/{action.Id}">{action.ActionText}</a>
				</td>
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

<style>
	.action-table {
		width: 100%;
		border-collapse: collapse;
	}
	.action-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		padding: 0.4rem 0.75rem;
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
	.col-action {
		width: 70%;
		max-width: 0;
	}
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
	.col-status {
		width: 20%;
	}
	.col-date {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}

	@media (max-width: 640px) {
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
			max-width: none;
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
		.action-table td::before {
			content: attr(data-label);
			font-size: 0.75rem;
			color: var(--text-muted);
			font-weight: 600;
			flex-shrink: 0;
		}
	}
</style>
