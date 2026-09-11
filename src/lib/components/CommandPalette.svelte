<script lang="ts">
	import { goto } from '$app/navigation';
	import { palette } from '$lib/stores/palette.svelte';
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { comicTitle } from '$lib/utils/comicTitle';

	interface Item {
		kind: 'domain' | 'node' | 'log';
		label: string;
		meta: string;
		href: string;
	}

	let query = $state('');
	let items = $state<Item[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let highlighted = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	async function ensureLoaded() {
		if (loaded || loading) return;
		loading = true;
		try {
			const [domains, nodes, logs] = await Promise.all([
				domainsApi.getAll(),
				knowledgeNodesApi.getAll(),
				logEntriesApi.getAll()
			]);
			const domainById = new Map(domains.map((d) => [d.DomainId, d]));
			const nodeById = new Map(nodes.map((n) => [n.Id, n]));

			const domainItems: Item[] = domains.map((d) => ({
				kind: 'domain',
				label: d.DomainName,
				meta: 'domain',
				href: `/domains?domain=${d.DomainId}`
			}));
			const nodeItems: Item[] = nodes.map((n) => ({
				kind: 'node',
				label: n.Title,
				meta: domainById.get(n.DomainId)?.DomainName ?? 'node',
				href: `/domains?domain=${n.DomainId}&node=${n.Id}`
			}));
			const logItems: Item[] = logs.map((l) => {
				const node = nodeById.get(l.NodeId);
				return {
					kind: 'log',
					label: l.Title || comicTitle(l.LogId),
					meta: node?.Title ?? 'entry',
					href: `/domains?domain=${node?.DomainId ?? ''}&node=${l.NodeId}&log=${l.LogId}`
				};
			});

			items = [...domainItems, ...nodeItems, ...logItems];
			loaded = true;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (palette.open) {
			ensureLoaded();
			highlighted = 0;
			queueMicrotask(() => inputEl?.focus());
		} else {
			query = '';
		}
	});

	let filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items.slice(0, 40);
		return items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 40);
	});

	function jump(item: Item) {
		palette.hide();
		goto(item.href);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			palette.hide();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlighted = Math.min(highlighted + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlighted = Math.max(highlighted - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const item = filtered[highlighted];
			if (item) jump(item);
		}
	}

	function kindLabel(kind: Item['kind']): string {
		return kind === 'domain' ? 'DOM' : kind === 'node' ? 'NODE' : 'LOG';
	}
</script>

{#if palette.open}
	<div
		class="palette-overlay"
		role="button"
		tabindex="-1"
		onclick={() => palette.hide()}
		onkeydown={(e) => e.key === 'Escape' && palette.hide()}
	>
		<div
			class="palette-box"
			role="dialog"
			aria-label="Jump to"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<input
				bind:this={inputEl}
				type="text"
				placeholder="Jump to domain / node / entry…"
				bind:value={query}
				onkeydown={onKeydown}
			/>
			<div class="palette-results">
				{#if loading}
					<div class="palette-empty">Loading index…</div>
				{:else if filtered.length === 0}
					<div class="palette-empty">No matches.</div>
				{:else}
					{#each filtered as item, i (item.href)}
						<button
							type="button"
							class="list-item"
							class:selected={i === highlighted}
							onmouseenter={() => (highlighted = i)}
							onclick={() => jump(item)}
						>
							[{kindLabel(item.kind)}] {item.label}
							<span class="list-item-meta">{item.meta}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
