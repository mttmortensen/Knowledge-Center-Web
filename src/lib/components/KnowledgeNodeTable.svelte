<script lang="ts">
	import { goto } from '$app/navigation';
	import type { KnowledgeNodeInline } from '$lib/types/api';

	let {
		nodes,
		logCounts,
		actionCounts
	}: {
		nodes: KnowledgeNodeInline[];
		logCounts: Map<number, number>;
		actionCounts: Map<number, number>;
	} = $props();
</script>

<table class="node-table">
	<thead>
		<tr>
			<th class="col-title">Title</th>
			<th class="col-type">Type</th>
			<th class="col-count">Logs</th>
			<th class="col-count">Actions</th>
			<th class="col-confidence">Confidence</th>
			<th class="col-status">Status</th>
			<th class="col-date">Updated</th>
		</tr>
	</thead>
	<tbody>
		{#each nodes as node (node.Id)}
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

<style>
	.node-table {
		width: 100%;
		border-collapse: collapse;
	}
	.node-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		padding: 0.4rem 0.75rem;
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

	@media (max-width: 640px) {
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
