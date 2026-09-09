<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Domain } from '$lib/types/api';

	let { domains, nodeCounts }: { domains: Domain[]; nodeCounts: Map<number, number> } = $props();
</script>

<table class="domain-table">
	<thead>
		<tr>
			<th class="col-name">Name</th>
			<th class="col-description">Description</th>
			<th class="col-count">Nodes</th>
			<th class="col-status">Status</th>
			<th class="col-date">Updated</th>
		</tr>
	</thead>
	<tbody>
		{#each domains as domain (domain.DomainId)}
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

<style>
	.domain-table {
		width: 100%;
		border-collapse: collapse;
	}
	.domain-table th {
		text-align: left;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
		padding: 0.4rem 0.75rem;
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

	@media (max-width: 640px) {
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
