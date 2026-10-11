<script lang="ts">
	import { page } from '$app/state';
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import type { Domain } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import DomainTable from '$lib/components/DomainTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import {
		ANY,
		matchesQuery,
		matchesSelect,
		optionsFrom,
		type FilterSelect
	} from '$lib/utils/tableFilter';
	import { untrack } from 'svelte';

	// /domains?archived=1 lists the archived domains instead of the active ones.
	const showArchived = $derived(page.url.searchParams.get('archived') === '1');

	let domains = $state<Domain[]>([]);
	let nodeCounts = $state<Map<number, number>>(new Map());
	let loading = $state(true);
	let error = $state('');

	let showCreate = $state(false);
	let name = $state('');
	let description = $state('');
	let status = $state('Active');
	let creating = $state(false);

	let search = $state('');
	let filters = $state<Record<string, string>>({ status: ANY });

	const filterSelects = $derived<FilterSelect[]>([
		{
			key: 'status',
			label: 'Status',
			allLabel: 'All statuses',
			options: optionsFrom(domains, (domain) => domain.DomainStatus)
		}
	]);

	const visibleDomains = $derived(
		domains.filter(
			(domain) =>
				matchesQuery(search, domain.DomainName, domain.DomainDescription) &&
				matchesSelect(filters.status, domain.DomainStatus)
		)
	);

	async function load() {
		loading = true;
		error = '';
		try {
			const [domainsResult, nodes] = await Promise.all([
				domainsApi.getAll(showArchived),
				knowledgeNodesApi.getAll(showArchived)
			]);
			domains = domainsResult.filter((domain) => domain.IsArchived === showArchived);
			const counts = new Map<number, number>();
			for (const node of nodes) {
				counts.set(node.DomainId, (counts.get(node.DomainId) ?? 0) + 1);
			}
			nodeCounts = counts;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load domains.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		showArchived;
		untrack(load);
	});

	async function createDomain(event: SubmitEvent) {
		event.preventDefault();
		creating = true;
		error = '';
		try {
			await domainsApi.create({
				DomainName: name,
				DomainDescription: description,
				DomainStatus: status
			});
			name = '';
			description = '';
			status = 'Active';
			showCreate = false;
			await load();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create domain.';
		} finally {
			creating = false;
		}
	}
</script>

<div class="container">
	<div class="row-between">
		<h1>{showArchived ? 'Archived Domains' : 'Domains'}</h1>
		{#if showArchived}
			<a href="/domains">View active domains</a>
		{:else}
			<button class="primary" onclick={() => (showCreate = !showCreate)}>
				{showCreate ? 'Cancel' : 'New domain'}
			</button>
		{/if}
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if showCreate && !showArchived}
		<form class="card" onsubmit={createDomain}>
			<div class="field">
				<label for="name">Name</label>
				<input id="name" type="text" bind:value={name} required />
			</div>
			<div class="field">
				<label for="description">Description</label>
				<textarea id="description" rows="2" bind:value={description}></textarea>
			</div>
			<div class="field">
				<label for="status">Status</label>
				<select id="status" bind:value={status}>
					<option>Active</option>
					<option>Inactive</option>
				</select>
			</div>
			<button type="submit" class="primary" disabled={creating}>
				{creating ? 'Creating…' : 'Create domain'}
			</button>
		</form>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if domains.length === 0}
		<div class="empty-state">
			{showArchived ? 'No archived domains.' : 'No domains yet. Create one to get started.'}
		</div>
	{:else}
		<FilterBar
			bind:search
			bind:values={filters}
			selects={filterSelects}
			placeholder="Search name or description…"
			searchLabel="Search domains"
			shown={visibleDomains.length}
			total={domains.length}
			itemLabel="domains"
		/>
		{#if visibleDomains.length === 0}
			<div class="empty-state">No domains match these filters.</div>
		{:else}
			<DomainTable domains={visibleDomains} {nodeCounts} />
		{/if}
	{/if}
</div>
