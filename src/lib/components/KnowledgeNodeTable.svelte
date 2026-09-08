<script lang="ts">
	import { goto } from '$app/navigation';
	import type { KnowledgeNodeInline } from '$lib/types/api';

	let { nodes }: { nodes: KnowledgeNodeInline[] } = $props();
</script>

<table class="node-table">
	<thead>
		<tr>
			<th class="col-title">Title</th>
			<th class="col-type">Type</th>
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
				<td class="col-type muted">{node.NodeType}</td>
				<td class="col-confidence muted">{node.ConfidenceLevel}/5</td>
				<td class="col-status"><span class="tag-pill">{node.Status}</span></td>
				<td class="col-date muted">{new Date(node.LastUpdated).toLocaleDateString()}</td>
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
</style>
