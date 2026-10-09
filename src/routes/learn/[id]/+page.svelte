<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { learnApi } from '$lib/api/learn';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { DemoForbiddenError } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { linkEntries } from '$lib/learn/parse';
	import LearnSheet from '$lib/components/learn/LearnSheet.svelte';
	import type { KnowledgeNode, LearnEntry, LearnSessionDetails } from '$lib/types/api';

	const sessionId = $derived(Number(page.params.id));

	let session = $state<LearnSessionDetails | null>(null);
	let entries = $state<LearnEntry[]>([]);
	let nodes = $state<KnowledgeNode[]>([]);
	let loading = $state(true);
	let error = $state('');
	let openOnly = $state(false);
	let sheet = $state<LearnSheet>();

	// Header fields edit in place, like entries: click, type, blur to save.
	let editingField = $state<'title' | 'topic' | 'node' | null>(null);
	let fieldDraft = $state('');

	const openCount = $derived(
		[...linkEntries(entries).values()].filter((l) => l.questionStatus === 'open').length
	);

	async function load() {
		loading = true;
		error = '';
		try {
			session = await learnApi.getSession(sessionId);
			entries = session.Entries;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load session.';
		} finally {
			loading = false;
		}

		// Arriving from the open-questions list: /learn/3#entry-12
		const target = /^#entry-(\d+)$/.exec(page.url.hash)?.[1];
		if (target) {
			await tick(); // the sheet only mounts once loading is false
			sheet?.jump(Number(target));
		}
	}

	onMount(load);

	function describeError(err: unknown, fallback: string) {
		return err instanceof DemoForbiddenError
			? err.message
			: err instanceof Error
				? err.message
				: fallback;
	}

	async function startField(field: 'title' | 'topic' | 'node') {
		if (!session || auth.isDemo) return;
		if (field === 'node' && nodes.length === 0) {
			try {
				nodes = (await knowledgeNodesApi.getAll()).sort((a, b) => a.Title.localeCompare(b.Title));
			} catch (err) {
				error = describeError(err, 'Failed to load knowledge nodes.');
				return;
			}
		}
		fieldDraft =
			field === 'title'
				? session.Title
				: field === 'topic'
					? (session.Topic ?? '')
					: String(session.NodeId ?? 0);
		editingField = field;
	}

	async function commitField() {
		const field = editingField;
		if (!session || !field) return;
		editingField = null;

		const value = fieldDraft.trim();
		if (field === 'title' && (!value || value === session.Title)) return;
		if (field === 'topic' && value === (session.Topic ?? '')) return;
		if (field === 'node' && Number(value) === (session.NodeId ?? 0)) return;

		try {
			const updated = await learnApi.updateSession(
				session.SessionId,
				field === 'title' ? { Title: value } : field === 'topic' ? { Topic: value } : { NodeId: Number(value) }
			);
			// Keep the sheet's live entries; only the header fields changed.
			session = { ...updated, Entries: entries };
		} catch (err) {
			error = describeError(err, 'Failed to update session.');
		}
	}

	function onFieldKey(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === 'Escape') {
			event.preventDefault();
			(event.currentTarget as HTMLElement).blur();
		}
	}

	function focusOnMount(node: HTMLElement) {
		node.focus();
		if (node instanceof HTMLInputElement) node.select();
	}

	async function exportSession() {
		if (!session) return;
		try {
			await learnApi.exportSession(session.SessionId);
		} catch (err) {
			error = describeError(err, 'Export failed.');
		}
	}

	async function deleteSession() {
		if (!session) return;
		if (!confirm(`Delete "${session.Title}" and all of its entries?`)) return;
		try {
			await learnApi.deleteSession(session.SessionId);
			goto('/learn');
		} catch (err) {
			error = describeError(err, 'Failed to delete session.');
		}
	}
</script>

<svelte:head>
	<title>{session ? `${session.Title} · Learn` : 'Learn'} · KC</title>
</svelte:head>

<div class="container">
	<div class="breadcrumb"><a href="/learn">Learn</a></div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if session}
		<header>
			{#if editingField === 'title'}
				<input
					class="title-input"
					type="text"
					maxlength="200"
					aria-label="Session title"
					bind:value={fieldDraft}
					onblur={commitField}
					onkeydown={onFieldKey}
					use:focusOnMount
				/>
			{:else}
				<h1>
					<button type="button" class="inline-edit" onclick={() => startField('title')} disabled={auth.isDemo}>
						{session.Title}
					</button>
				</h1>
			{/if}

			<div class="meta muted">
				{#if editingField === 'topic'}
					<input
						class="meta-input"
						type="text"
						maxlength="200"
						placeholder="Topic"
						aria-label="Topic"
						bind:value={fieldDraft}
						onblur={commitField}
						onkeydown={onFieldKey}
						use:focusOnMount
					/>
				{:else}
					<button type="button" class="inline-edit" onclick={() => startField('topic')} disabled={auth.isDemo}>
						{session.Topic || 'No topic'}
					</button>
				{/if}
				<span>·</span>
				{#if editingField === 'node'}
					<select
						class="meta-input"
						aria-label="Knowledge node"
						bind:value={fieldDraft}
						onchange={(e) => e.currentTarget.blur()}
						onblur={commitField}
						use:focusOnMount
					>
						<option value="0">No knowledge node</option>
						{#each nodes as node (node.Id)}
							<option value={String(node.Id)}>{node.Title}</option>
						{/each}
					</select>
				{:else}
					<button type="button" class="inline-edit" onclick={() => startField('node')} disabled={auth.isDemo}>
						{session.NodeTitle ?? 'No knowledge node'}
					</button>
				{/if}
				<span>·</span>
				<span>started {new Date(session.CreatedAt).toLocaleDateString()}</span>
			</div>

			<div class="links">
				<button type="button" class="link" class:active={openOnly} onclick={() => (openOnly = !openOnly)}>
					{openOnly ? 'Show everything' : `Open questions (${openCount})`}
				</button>
				<button type="button" class="link" onclick={exportSession}>Export .md</button>
				{#if !auth.isDemo}
					<button type="button" class="link danger" onclick={deleteSession}>Delete session</button>
				{/if}
			</div>
		</header>

		<LearnSheet
			bind:this={sheet}
			bind:entries
			bind:openOnly
			sessionId={session.SessionId}
			readonly={auth.isDemo}
		/>
	{/if}
</div>

<style>
	header {
		margin-bottom: 1rem;
	}
	h1 {
		margin: 0 0 0.35rem;
	}
	.inline-edit {
		all: unset;
		cursor: text;
		border-radius: 4px;
	}
	.inline-edit:hover:not(:disabled) {
		background: var(--bg-hover);
	}
	.inline-edit:disabled {
		cursor: default;
	}
	.inline-edit:focus-visible {
		outline: 1px solid var(--accent);
	}
	.title-input {
		font-size: 2em;
		font-weight: 600;
		margin: 0.67em 0 0.35rem;
		padding: 0 0.2rem;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}
	.meta-input {
		width: auto;
		min-width: 12rem;
		padding: 0.15rem 0.4rem;
		font-size: 0.85rem;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin-top: 0.6rem;
	}
	.link {
		all: unset;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--accent);
	}
	.link:hover {
		text-decoration: underline;
	}
	.link:focus-visible {
		outline: 1px solid var(--accent);
	}
	.link.active {
		color: var(--warning);
	}
	.link.danger {
		color: var(--danger);
	}
</style>
