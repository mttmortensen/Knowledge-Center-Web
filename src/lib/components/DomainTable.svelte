<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Domain } from '$lib/types/api';

	let { domains }: { domains: Domain[] } = $props();
</script>

<table class="domain-table">
	<thead>
		<tr>
			<th class="col-name">Name</th>
			<th class="col-description">Description</th>
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
				<td class="col-description muted">{domain.DomainDescription}</td>
				<td class="col-status"><span class="tag-pill">{domain.DomainStatus}</span></td>
				<td class="col-date muted">{new Date(domain.LastUpdated).toLocaleDateString()}</td>
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
