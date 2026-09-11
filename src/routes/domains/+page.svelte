<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { domainsApi } from '$lib/api/domains';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { actionsApi } from '$lib/api/actions';
	import type { Domain, KnowledgeNode, LogEntry, ActionItem } from '$lib/types/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { palette } from '$lib/stores/palette.svelte';
	import { footer } from '$lib/stores/footer.svelte';
	import { isTypingTarget } from '$lib/utils/keyboard';
	import { comicTitle } from '$lib/utils/comicTitle';
	import TilingPane from '$lib/components/TilingPane.svelte';
	import ZoomEditor from '$lib/components/ZoomEditor.svelte';

	type Pane = 'domains' | 'nodes' | 'logs';
	// 'logs' identifies column 3 as a whole (the tiling-column focus target);
	// which of its two stacked sub-panes is active is tracked separately.
	type Column3SubPane = 'logs' | 'actions';
	type ZoomTarget = { kind: 'log' | 'action'; id: number };

	let domains = $state<Domain[]>([]);
	let nodes = $state<KnowledgeNode[]>([]);
	let logs = $state<LogEntry[]>([]);
	let nodeActions = $state<ActionItem[]>([]);
	let loadingBase = $state(true);
	let logsLoading = $state(false);
	let actionsLoading = $state(false);
	let error = $state('');

	let selectedDomainId = $state<number | null>(null);
	let selectedNodeId = $state<number | null>(null);
	let selectedLogId = $state<number | null>(null);
	let logCursor = $state<number | null>(null);
	let actionCursor = $state<number | null>(null);

	let focusedPane = $state<Pane>('domains');
	let column3SubPane = $state<Column3SubPane>('logs');

	let showCreateDomain = $state(false);
	let newDomainName = $state('');
	let newDomainDescription = $state('');
	let creatingDomain = $state(false);

	let showCreateNode = $state(false);
	let newNodeTitle = $state('');
	let newNodeType = $state('Concept');
	let creatingNode = $state(false);

	let showCreateAction = $state(false);
	let newActionText = $state('');
	let creatingAction = $state(false);

	let zoomTarget = $state<ZoomTarget | null>(null);

	let nodesInDomain = $derived(
		[...nodes]
			.filter((n) => n.DomainId === selectedDomainId)
			.sort((a, b) => a.Title.localeCompare(b.Title))
	);
	let selectedDomain = $derived(domains.find((d) => d.DomainId === selectedDomainId) ?? null);
	let selectedNode = $derived(nodes.find((n) => n.Id === selectedNodeId) ?? null);
	let zoomedLog = $derived(
		zoomTarget?.kind === 'log' ? (logs.find((l) => l.LogId === zoomTarget!.id) ?? null) : null
	);
	let zoomedAction = $derived(
		zoomTarget?.kind === 'action'
			? (nodeActions.find((a) => a.Id === zoomTarget!.id) ?? null)
			: null
	);

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

	let actionsRequestId = 0;

	async function loadActionsForNode(nodeId: number) {
		const requestId = ++actionsRequestId;
		actionsLoading = true;
		try {
			const [open, completed] = await Promise.all([
				actionsApi.getOpenForNode(nodeId),
				actionsApi.getCompletedForNode(nodeId)
			]);
			if (requestId !== actionsRequestId) return;
			nodeActions = [
				...[...open].sort(
					(a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
				),
				...[...completed].sort(
					(a, b) =>
						new Date(b.CompletedAt ?? b.CreatedAt).getTime() -
						new Date(a.CompletedAt ?? a.CreatedAt).getTime()
				)
			];
		} catch (err) {
			if (requestId === actionsRequestId) {
				error = err instanceof Error ? err.message : 'Failed to load actions.';
			}
		} finally {
			if (requestId === actionsRequestId) actionsLoading = false;
		}
	}

	// Loads the logs and actions for a node into local state without touching
	// the URL — shared by user-initiated selection and by syncFromUrl().
	async function applyNode(nodeId: number | null) {
		selectedNodeId = nodeId;
		selectedLogId = null;
		// The node's changing out from under whatever was zoomed (if
		// anything) — syncFromUrl re-opens it right after if the URL still
		// names a log that belongs to the new node.
		zoomTarget = null;
		if (nodeId != null) {
			await Promise.all([loadLogsForNode(nodeId), loadActionsForNode(nodeId)]);
			logCursor = logs[0]?.LogId ?? null;
			actionCursor = nodeActions[0]?.Id ?? null;
		} else {
			logs = [];
			logCursor = null;
			nodeActions = [];
			actionCursor = null;
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

	// Opening a log zooms it fullscreen (see ZoomEditor) and reflects the log
	// id in the URL, same as domain/node selection, so palette jumps and
	// browser back/forward can deep-link straight into it. Actions aren't
	// URL-synced (they never were, pre-zoom) — only their in-list cursor.
	function openZoomLog(id: number, sync = true) {
		zoomTarget = { kind: 'log', id };
		selectedLogId = id;
		logCursor = id;
		if (sync) syncUrl();
	}

	function openZoomAction(id: number) {
		zoomTarget = { kind: 'action', id };
		actionCursor = id;
	}

	function closeZoom() {
		zoomTarget = null;
		if (selectedLogId != null) {
			selectedLogId = null;
			syncUrl();
		}
	}

	function handleZoomSaved(updated: LogEntry | ActionItem) {
		if (zoomTarget?.kind === 'log') {
			const u = updated as LogEntry;
			logs = logs.map((l) => (l.LogId === u.LogId ? u : l));
		} else if (zoomTarget?.kind === 'action') {
			const u = updated as ActionItem;
			nodeActions = nodeActions.map((a) => (a.Id === u.Id ? u : a));
		}
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
		if (logId != null) {
			logCursor = logId;
			if (!(zoomTarget?.kind === 'log' && zoomTarget.id === logId)) {
				zoomTarget = { kind: 'log', id: logId };
			}
		} else if (zoomTarget?.kind === 'log') {
			zoomTarget = null;
		}
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

	async function createAction(event: SubmitEvent) {
		event.preventDefault();
		if (!newActionText.trim() || selectedNodeId == null) return;
		creatingAction = true;
		error = '';
		try {
			const created = await actionsApi.create({
				KnowledgeNodeId: selectedNodeId,
				ActionText: newActionText
			});
			nodeActions = [created, ...nodeActions];
			actionCursor = created.Id;
			newActionText = '';
			showCreateAction = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create action.';
		} finally {
			creatingAction = false;
		}
	}

	function actionStatusLabel(status: string): string {
		return status === 'Completed' ? 'Done' : status;
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
		} else if (focusedPane === 'logs' && column3SubPane === 'logs') {
			const curId = logCursor ?? logs[0]?.LogId ?? null;
			const idx = logs.findIndex((l) => l.LogId === curId);
			const next = Math.min(Math.max(idx + direction, 0), logs.length - 1);
			if (logs[next]) logCursor = logs[next].LogId;
		} else if (focusedPane === 'logs' && column3SubPane === 'actions') {
			const curId = actionCursor ?? nodeActions[0]?.Id ?? null;
			const idx = nodeActions.findIndex((a) => a.Id === curId);
			const next = Math.min(Math.max(idx + direction, 0), nodeActions.length - 1);
			if (nodeActions[next]) actionCursor = nodeActions[next].Id;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		// ZoomEditor owns the keyboard entirely while it's mounted (its own
		// <svelte:window> listener) — bail so pane navigation doesn't also
		// silently run in the background underneath it.
		if (zoomTarget || palette.open || isTypingTarget(e.target)) return;

		if (e.key === 'ArrowLeft' || (e.altKey && e.key.toLowerCase() === 'h')) {
			e.preventDefault();
			cyclePane(-1);
		} else if (e.key === 'ArrowRight' || (e.altKey && e.key.toLowerCase() === 'l')) {
			e.preventDefault();
			cyclePane(1);
		} else if (e.altKey && e.key.toLowerCase() === 'j') {
			e.preventDefault();
			focusedPane = 'logs';
			column3SubPane = 'actions';
		} else if (e.altKey && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			focusedPane = 'logs';
			column3SubPane = 'logs';
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			moveCursor(-1);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			moveCursor(1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (focusedPane === 'logs' && column3SubPane === 'logs') {
				if (logCursor != null) openZoomLog(logCursor);
			} else if (focusedPane === 'logs' && column3SubPane === 'actions') {
				if (actionCursor != null) openZoomAction(actionCursor);
			} else {
				cyclePane(1);
			}
		} else if (e.altKey && e.key.toLowerCase() === 'n') {
			e.preventDefault();
			if (focusedPane === 'logs' && column3SubPane === 'actions') {
				showCreateAction = true;
			} else {
				const href = newLogEntryHref();
				if (href) goto(href);
			}
		}
	}

	$effect(() => {
		// Irrelevant while zoomed — ZoomEditor's fullscreen overlay covers the
		// footer bar entirely — but harmless to leave computing in the
		// background, and it's immediately right again once closed.
		const hints = [
			{ key: 'ALT+H/L', label: 'Columns' },
			{ key: 'ALT+J/K', label: 'Logs / Actions' },
			{ key: 'UP/DN', label: 'Move' },
			{ key: 'ENTER', label: focusedPane === 'logs' ? 'Zoom' : 'Next pane' },
			{ key: 'ALT+N', label: 'New' },
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
	{:else if zoomTarget}
		{#key `${zoomTarget.kind}:${zoomTarget.id}`}
			<ZoomEditor
				kind={zoomTarget.kind}
				logEntry={zoomedLog ?? undefined}
				actionItem={zoomedAction ?? undefined}
				domainName={selectedDomain?.DomainName ?? ''}
				nodeTitle={selectedNode?.Title ?? ''}
				onClose={closeZoom}
				onSaved={handleZoomSaved}
			/>
		{/key}
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

			<div class="column3">
				<TilingPane
					index="C1:"
					title="Log Entries"
					focused={focusedPane === 'logs' && column3SubPane === 'logs'}
					onFocus={() => {
						focusedPane = 'logs';
						column3SubPane = 'logs';
					}}
					flex={3}
				>
					{#snippet actions()}
						<a href={newLogEntryHref()} onclick={(e) => selectedNodeId == null && e.preventDefault()}>
							<button type="button" disabled={selectedNodeId == null}>+ new</button>
						</a>
					{/snippet}

					{#if selectedNodeId == null}
						<div class="empty-state">Select a knowledge node.</div>
					{:else if logsLoading}
						<p class="muted" style="padding: 0.75rem;">Loading…</p>
					{:else if logs.length === 0}
						<div class="empty-state">No log entries yet.</div>
					{:else}
						{#each logs as log (log.LogId)}
							<button
								type="button"
								class="list-item"
								class:selected={log.LogId === logCursor}
								onclick={() => openZoomLog(log.LogId)}
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

				<TilingPane
					index="C2:"
					title="Actions"
					focused={focusedPane === 'logs' && column3SubPane === 'actions'}
					onFocus={() => {
						focusedPane = 'logs';
						column3SubPane = 'actions';
					}}
					flex={2}
				>
					{#snippet actions()}
						<button
							type="button"
							disabled={selectedNodeId == null}
							onclick={(e) => {
								e.stopPropagation();
								showCreateAction = !showCreateAction;
							}}
						>
							{showCreateAction ? 'x' : '+ new'}
						</button>
					{/snippet}

					{#if showCreateAction}
						<form class="inline-form" onsubmit={createAction}>
							<textarea placeholder="Action text" rows="2" bind:value={newActionText} required
							></textarea>
							<button type="submit" class="primary" disabled={creatingAction}>
								{creatingAction ? 'Creating…' : 'Create'}
							</button>
						</form>
					{/if}

					{#if selectedNodeId == null}
						<div class="empty-state">Select a knowledge node.</div>
					{:else if actionsLoading}
						<p class="muted" style="padding: 0.75rem;">Loading…</p>
					{:else if nodeActions.length === 0}
						<div class="empty-state">No actions yet.</div>
					{:else}
						{#each nodeActions as action (action.Id)}
							<button
								type="button"
								class="list-item action-row"
								class:selected={action.Id === actionCursor}
								class:done={action.Status === 'Completed'}
								onclick={() => openZoomAction(action.Id)}
							>
								<span
									class="tag-pill"
									class:open={action.Status === 'Open'}
									class:completed={action.Status === 'Completed'}
								>
									{actionStatusLabel(action.Status)}
								</span>
								{action.ActionText}
							</button>
						{/each}
					{/if}
				</TilingPane>
			</div>
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
	.column3 {
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.action-row {
		display: block;
	}
	.action-row.done {
		color: var(--cyan-dim);
	}
	.action-row.done.selected {
		/* The inverted block already swaps to blue-on-gray; keep that instead
		   of the dimmed muted tone so the selection state still reads clearly. */
		color: var(--select-text);
	}

	@media (max-width: 900px) {
		.browse {
			height: auto;
		}
		.workspace-grid {
			grid-template-columns: 1fr;
			grid-auto-rows: minmax(220px, auto);
		}
		.column3 {
			min-height: 420px;
		}
	}
</style>
