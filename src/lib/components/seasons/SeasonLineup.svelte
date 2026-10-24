<script lang="ts">
	import type { Domain, SeasonDomain } from '$lib/types/api';
	import RolePill from './RolePill.svelte';

	// Read-only lineup: Focus, Passive, and every other active domain as Resting.
	let {
		members,
		allDomains,
		editHref,
		canEdit = true
	}: { members: SeasonDomain[]; allDomains: Domain[]; editHref?: string; canEdit?: boolean } = $props();

	const focus = $derived(members.filter((m) => m.Role === 'Focus'));
	const passive = $derived(members.filter((m) => m.Role === 'Passive'));
	const resting = $derived(
		allDomains.filter((d) => !d.IsArchived && !members.some((m) => m.DomainId === d.DomainId))
	);
</script>

<div class="lineup">
	<div class="row-between">
		<h3>Lineup</h3>
		{#if editHref}
			{#if canEdit}
				<a href={editHref}><button class="small">Edit lineup</button></a>
			{:else}
				<button class="small" disabled>Edit lineup</button>
			{/if}
		{/if}
	</div>

	{#each [{ label: 'Focus', items: focus }, { label: 'Passive', items: passive }] as group (group.label)}
		<div class="group">
			<span class="group-label">{group.label} · {group.items.length}</span>
			{#each group.items as m (m.DomainId)}
				<div class="item">
					<a href="/domains/{m.DomainId}"><RolePill role={m.Role} label={m.DomainName} /></a>
					{#if m.Note}<span class="muted">{m.Note}</span>{/if}
				</div>
			{:else}
				<span class="muted">None</span>
			{/each}
		</div>
	{/each}

	{#if resting.length}
		<div class="group">
			<span class="group-label">Resting · {resting.length}</span>
			<div class="chips">
				{#each resting as d (d.DomainId)}
					<a href="/domains/{d.DomainId}"><RolePill role="Resting" label={d.DomainName} /></a>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.lineup {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	h3 {
		margin: 0;
		font-size: 1rem;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.group-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	.item {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	a:hover {
		text-decoration: none;
	}
	button.small {
		padding: 0.25rem 0.6rem;
		font-size: 0.85rem;
	}
</style>
