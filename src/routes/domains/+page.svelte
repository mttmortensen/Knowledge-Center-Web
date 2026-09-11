<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import type { Domain, KnowledgeNode, LogEntry } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { palette } from '$lib/stores/palette.svelte';
	import { footer } from '$lib/stores/footer.svelte';
	import { isTypingTarget } from '$lib/utils/keyboard';
	import { comicTitle, comicByline } from '$lib/utils/comicTitle';
	import TilingPane from '$lib/components/TilingPane.svelte';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';

	type Pane = 'domains' | 'nodes' | 'logs';

	let domains = $state<Domain[]>([]);
	let nodes = $state<KnowledgeNode[]>([]);
	let logs = $state<LogEntry[]>([]);
	let loadingBase = $state(true);
	let logsLoading = $state(false);
	let error = $state('');

	let selectedDomainId = $state<number | null>(null);
	let selectedNodeId = $state<number | null>(null);
	let selectedLogId = $state<number | null>(null);
	let logCursor = $state<number | null>(null);

	let focusedPane = $state<Pane>('domains');

	let showCreateDomain = $state(false);
	let newDomainName = $state('');
	let newDomainDescription = $state('');
	let creatingDomain = $state(false);

	let showCreateNode = $state(false);
	let newNodeTitle = $state('');
	let newNodeType = $state('Concept');
	let creatingNode = $state(false);

	let nodesInDomain = $derived(
		[...nodes]
			.filter((n) => n.DomainId === selectedDomainId)
			.sort((a, b) => a.Title.localeCompare(b.Title))
	);
	let selectedNode = $derived(nodes.find((n) => n.Id === selectedNodeId) ?? null);
	let selectedEntry = $derived(logs.find((l) => l.LogId === selectedLogId) ?? null);

	function syncUrl() {
		const params = new URLSearchParams();
		if (selectedDomainId != null) params.set('domain', String(selectedDomainId));
		if (selectedNodeId != null) params.set('node', String(selectedNodeId));
		if (selectedLogId != null) params.set('log', String(selectedLogId));
		goto(`/domains?${params.toString()}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	let logsRequestId = 0;

	async function loadLogsForNode(nodeId: number) {
		const requestId = ++logsRequestId;
		logsLoading = true;
		try {
			const result = await logEntriesApi.getAll(nodeId);
			if (requestId !== logsRequestId) return;
			logs = [...result].sort(
				(a, b) => new Date(b.EntryDate).getTime() - new Date(a.EntryDate).getTime()
			);
		} catch (err) {
			if (requestId === logsRequestId) {
				error = err instanceof Error ? err.message : 'Failed to load log entries.';
			}
		} finally {
			if (requestId === logsRequestId) logsLoading = false;
		}
	}

	// Loads the logs for a node into local state without touching the URL —
	// shared by user-initiated selection and by syncFromUrl().
	async function applyNode(nodeId: number | null) {
		selectedNodeId = nodeId;
		selectedLogId = null;
		if (nodeId != null) {
			await loadLogsForNode(nodeId);
			logCursor = logs[0]?.LogId ?? null;
		} else {
			logs = [];
			logCursor = null;
		}
	}

	// User-initiated: click/keyboard selection. Updates state immediately, then
	// pushes the new selection into the URL.
	async function selectDomain(id: number, focusNext = true) {
		selectedDomainId = id;
		const domainNodes = [...nodes]
			.filter((n) => n.DomainId === id)
			.sort((a, b) => a.Title.localeCompare(b.Title));
		const nextNodeId = domainNodes.some((n) => n.Id === selectedNodeId)
			? selectedNodeId
			: (domainNodes[0]?.Id ?? null);
		await applyNode(nextNodeId);
		if (focusNext) focusedPane = 'nodes';
		syncUrl();
	}

	async function selectNode(id: number | null) {
		await applyNode(id);
		syncUrl();
	}

	function selectLog(id: number | null) {
		selectedLogId = id;
		if (id != null) logCursor = id;
		syncUrl();
	}

	// URL-driven: reconciles local state to whatever the URL says. Runs on
	// first load and whenever the URL changes from outside this page's own
	// selectors — the command palette, browser back/forward, a pasted link.
	async function syncFromUrl() {
		const params = page.url.searchParams;
		const domainParam = Number(params.get('domain'));
		const nodeParam = Number(params.get('node'));
		const logParam = Number(params.get('log'));

		const domainId = domains.some((d) => d.DomainId === domainParam)
			? domainParam
			: (domains[0]?.DomainId ?? null);
		const domainChanged = domainId !== selectedDomainId;
		selectedDomainId = domainId;

		if (domainId == null) {
			if (selectedNodeId != null) await applyNode(null);
			return;
		}

		const domainNodes = nodes.filter((n) => n.DomainId === domainId);
		const nodeId = domainNodes.some((n) => n.Id === nodeParam)
			? nodeParam
			: (domainNodes[0]?.Id ?? null);

		if (domainChanged || nodeId !== selectedNodeId) {
			await applyNode(nodeId);
		}

		const logId = logs.some((l) => l.LogId === logParam) ? logParam : null;
		selectedLogId = logId;
		if (logId != null) logCursor = logId;
	}

	onMount(async () => {
		error = '';
		try {
			const [domainsResult, nodesResult] = await Promise.all([
				domainsApi.getAll(),
				knowledgeNodesApi.getAll()
			]);
			domains = [...domainsResult].sort((a, b) => a.DomainName.localeCompare(b.DomainName));
			nodes = nodesResult;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load workspace.';
		} finally {
			loadingBase = false;
		}
	});

	$effect(() => {
		page.url.search;
		if (loadingBase) return;
		// syncFromUrl() reads and writes selectedDomainId/selectedNodeId/etc. as
		// part of reconciling against the URL. Left tracked, those reads would
		// make this effect depend on state it itself just wrote, re-running
		// immediately and stomping an in-flight optimistic update (e.g. from
		// arrow-key navigation) with the stale URL value from before syncUrl()
		// finishes. Only the URL itself (and the initial load gate) should
		// trigger a re-sync.
		untrack(() => syncFromUrl());
	});

	async function createDomain(event: SubmitEvent) {
		event.preventDefault();
		if (!newDomainName.trim()) return;
		creatingDomain = true;
		error = '';
		try {
			const created = await domainsApi.create({
				DomainName: newDomainName,
				DomainDescription: newDomainDescription,
				DomainStatus: 'Active'
			});
			domains = [...domains, created].sort((a, b) => a.DomainName.localeCompare(b.DomainName));
			newDomainName = '';
			newDomainDescription = '';
			showCreateDomain = false;
			await selectDomain(created.DomainId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create domain.';
		} finally {
			creatingDomain = false;
		}
	}

	async function createNode(event: SubmitEvent) {
		event.preventDefault();
		if (!newNodeTitle.trim() || selectedDomainId == null) return;
		creatingNode = true;
		error = '';
		try {
			const created = await knowledgeNodesApi.create({
				Title: newNodeTitle,
				DomainId: selectedDomainId,
				NodeType: newNodeType,
				Description: '',
				ConfidenceLevel: 3,
				Status: 'Exploring'
			});
			nodes = [...nodes, created];
			newNodeTitle = '';
			showCreateNode = false;
			await selectNode(created.Id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create knowledge node.';
		} finally {
			creatingNode = false;
		}
	}

	function newLogEntryHref(): string {
		if (selectedNodeId == null) return '';
		const params = new URLSearchParams();
		if (selectedDomainId != null) params.set('domain', String(selectedDomainId));
		return `/nodes/${selectedNodeId}/logs/new?${params.toString()}`;
	}

	const PANE_ORDER: Pane[] = ['domains', 'nodes', 'logs'];

	function cyclePane(direction: 1 | -1) {
		const idx = PANE_ORDER.indexOf(focusedPane);
		focusedPane = PANE_ORDER[(idx + direction + PANE_ORDER.length) % PANE_ORDER.length];
	}

	function moveCursor(direction: 1 | -1) {
		if (focusedPane === 'domains') {
			const idx = domains.findIndex((d) => d.DomainId === selectedDomainId);
			const next = Math.min(Math.max(idx + direction, 0), domains.length - 1);
			if (domains[next]) selectDomain(domains[next].DomainId, false);
		} else if (focusedPane === 'nodes') {
			const idx = nodesInDomain.findIndex((n) => n.Id === selectedNodeId);
			const next = Math.min(Math.max(idx + direction, 0), nodesInDomain.length - 1);
			if (nodesInDomain[next]) selectNode(nodesInDomain[next].Id);
		} else if (focusedPane === 'logs' && selectedLogId == null) {
			const curId = logCursor ?? logs[0]?.LogId ?? null;
			const idx = logs.findIndex((l) => l.LogId === curId);
			const next = Math.min(Math.max(idx + direction, 0), logs.length - 1);
			if (logs[next]) logCursor = logs[next].LogId;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (palette.open || isTypingTarget(e.target)) return;

		if (e.key === 'ArrowLeft' || (e.altKey && e.key.toLowerCase() === 'h')) {
			e.preventDefault();
			cyclePane(-1);
		} else if (e.key === 'ArrowRight' || (e.altKey && e.key.toLowerCase() === 'l')) {
			e.preventDefault();
			cyclePane(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			moveCursor(-1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			moveCursor(1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (focusedPane === 'logs' && selectedLogId == null && logCursor != null) {
				selectLog(logCursor);
			} else if (focusedPane !== 'logs') {
				cyclePane(1);
			}
		} else if (e.key === 'Escape') {
			if (selectedLogId != null) {
				e.preventDefault();
				selectLog(null);
			}
		} else if (e.altKey && e.key.toLowerCase() === 'n') {
			e.preventDefault();
			const href = newLogEntryHref();
			if (href) goto(href);
		}
	}

	$effect(() => {
		const hints = [
			{ key: 'ALT+H/L', label: 'Pane' },
			{ key: 'UP/DN', label: 'Move' },
			{
				key: 'ENTER',
				label: focusedPane === 'logs' ? (selectedLogId != null ? 'Viewing' : 'Open') : 'Next pane'
			},
			{ key: 'ESC', label: 'Back' },
			{ key: 'ALT+N', label: 'New entry' },
			{ key: 'ALT+F', label: 'Jump' }
		];
		footer.set(hints);
	});
	onDestroy(() => footer.reset());

	function preview(content: string): string {
		const plain = content.replace(/[#*_`>-]/g, '').trim();
		return plain.length > 90 ? `${plain.slice(0, 90)}…` : plain;
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="browse">
	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loadingBase}
		<p class="muted" style="padding: 1rem;">Loading workspace…</p>
	{:else}
		<div class="workspace-grid">
			<TilingPane
				index={1}
				title="Domains"
				focused={focusedPane === 'domains'}
				onFocus={() => (focusedPane = 'domains')}
			>
				{#snippet actions()}
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							showCreateDomain = !showCreateDomain;
						}}
					>
						{showCreateDomain ? 'x' : '+ new'}
					</button>
				{/snippet}

				{#if showCreateDomain}
					<form class="inline-form" onsubmit={createDomain}>
						<input type="text" placeholder="Domain name" bind:value={newDomainName} required />
						<input
							type="text"
							placeholder="Description (optional)"
							bind:value={newDomainDescription}
						/>
						<button type="submit" class="primary" disabled={creatingDomain}>
							{creatingDomain ? 'Creating…' : 'Create'}
						</button>
					</form>
				{/if}

				{#if domains.length === 0}
					<div class="empty-state">No domains yet.</div>
				{:else}
					{#each domains as domain (domain.DomainId)}
						<button
							type="button"
							class="list-item"
							class:selected={domain.DomainId === selectedDomainId}
							onclick={() => selectDomain(domain.DomainId)}
						>
							{domain.DomainName}
							<span class="list-item-meta"
								>[{domain.DomainStatus}] · {nodes.filter((n) => n.DomainId === domain.DomainId)
									.length} node(s)</span
							>
						</button>
					{/each}
				{/if}
			</TilingPane>

			<TilingPane
				index={2}
				title="Knowledge Nodes"
				focused={focusedPane === 'nodes'}
				onFocus={() => (focusedPane = 'nodes')}
			>
				{#snippet actions()}
					<button
						type="button"
						disabled={selectedDomainId == null}
						onclick={(e) => {
							e.stopPropagation();
							showCreateNode = !showCreateNode;
						}}
					>
						{showCreateNode ? 'x' : '+ new'}
					</button>
				{/snippet}

				{#if showCreateNode}
					<form class="inline-form" onsubmit={createNode}>
						<input type="text" placeholder="Node title" bind:value={newNodeTitle} required />
						<select bind:value={newNodeType}>
							<option>Concept</option>
							<option>Project</option>
						</select>
						<button type="submit" class="primary" disabled={creatingNode}>
							{creatingNode ? 'Creating…' : 'Create'}
						</button>
					</form>
				{/if}

				{#if selectedDomainId == null}
					<div class="empty-state">Select a domain.</div>
				{:else if nodesInDomain.length === 0}
					<div class="empty-state">No knowledge nodes in this domain.</div>
				{:else}
					{#each nodesInDomain as node (node.Id)}
						<button
							type="button"
							class="list-item"
							class:selected={node.Id === selectedNodeId}
							onclick={() => selectNode(node.Id)}
						>
							{node.Title}
							<span class="list-item-meta"
								>[{node.NodeType}] [{node.Status}] · confidence {node.ConfidenceLevel}/5</span
							>
						</button>
					{/each}
				{/if}
			</TilingPane>

			<TilingPane
				index={3}
				title={selectedEntry ? 'Log Entry' : 'Log Entries'}
				focused={focusedPane === 'logs'}
				onFocus={() => (focusedPane = 'logs')}
			>
				{#snippet actions()}
					{#if selectedEntry}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								selectLog(null);
							}}
						>
							&lt; back
						</button>
					{:else}
						<a href={newLogEntryHref()} onclick={(e) => selectedNodeId == null && e.preventDefault()}>
							<button type="button" disabled={selectedNodeId == null}>+ new</button>
						</a>
					{/if}
				{/snippet}

				{#if selectedNodeId == null}
					<div class="empty-state">Select a knowledge node.</div>
				{:else if logsLoading}
					<p class="muted" style="padding: 0.75rem;">Loading…</p>
				{:else if selectedEntry}
					<div class="entry-detail">
						<div class="row-between">
							<h3 style="margin: 0;">{selectedEntry.Title || comicTitle(selectedEntry.LogId)}</h3>
							<span class="muted">{new Date(selectedEntry.EntryDate).toLocaleString()}</span>
						</div>
						{#if !selectedEntry.Title}
							<p class="muted">{comicByline(selectedEntry.LogId)}</p>
						{/if}
						{#if selectedEntry.Tags.length > 0}
							<div class="row" style="flex-wrap: wrap; margin: 0.5rem 0;">
								{#each selectedEntry.Tags as tag (tag.TagId)}
									<span class="tag-pill">{tag.Name}</span>
								{/each}
							</div>
						{/if}
						{#if selectedEntry.ChatURL}
							<p><a href={selectedEntry.ChatURL} target="_blank" rel="noopener">Related chat ↗</a></p>
						{/if}
						<TiptapEditor value={selectedEntry.Content} editable={false} />
						<p class="muted" style="margin-top: 0.75rem;">
							<a href="/logs/{selectedEntry.LogId}">Open full page to edit or delete ↗</a>
						</p>
					</div>
				{:else if logs.length === 0}
					<div class="empty-state">No log entries yet.</div>
				{:else}
					{#each logs as log (log.LogId)}
						<button
							type="button"
							class="list-item"
							class:selected={log.LogId === logCursor}
							onclick={() => selectLog(log.LogId)}
						>
							{log.Title || preview(log.Content) || comicTitle(log.LogId)}
							<span class="list-item-meta">
								{new Date(log.EntryDate).toLocaleDateString()}
								{#each log.Tags as tag (tag.TagId)}
									<span class="tag-pill">{tag.Name}</span>{' '}
								{/each}
							</span>
						</button>
					{/each}
				{/if}
			</TilingPane>
		</div>
	{/if}
</div>

<style>
	.browse {
		height: calc(100vh - var(--statusbar-h) - var(--footerbar-h));
		display: flex;
		flex-direction: column;
	}
	.browse .error-banner {
		margin: 0.5rem;
	}
	.workspace-grid {
		flex: 1;
		grid-template-columns: 260px 300px 1fr;
	}
	.inline-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem;
		border-bottom: 1px solid var(--border);
	}
	.entry-detail {
		padding: 0.75rem;
	}

	@media (max-width: 900px) {
		.browse {
			height: auto;
		}
		.workspace-grid {
			grid-template-columns: 1fr;
			grid-auto-rows: minmax(220px, auto);
		}
	}
</style>
