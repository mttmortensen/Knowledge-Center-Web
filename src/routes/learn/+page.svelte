<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { learnApi } from '$lib/api/learn';
	import { knowledgeNodesApi } from '$lib/api/knowledgeNodes';
	import { DemoForbiddenError } from '$lib/api/client';
	import { auth } from '$lib/stores/auth.svelte';
	import { parseSource } from '$lib/learn/parse';
	import { renderInlineMarkdown } from '$lib/learn/render';
	import { matchesQuery } from '$lib/utils/tableFilter';
	import type { KnowledgeNode, LearnOpenQuestion, LearnSession } from '$lib/types/api';

	let sessions = $state<LearnSession[]>([]);
	let questions = $state<LearnOpenQuestion[]>([]);
	let nodes = $state<KnowledgeNode[]>([]);
	let loading = $state(true);
	let error = $state('');
	let search = $state('');

	// ?view=questions is the cross-session open-questions view.
	const view = $derived(page.url.searchParams.get('view') === 'questions' ? 'questions' : 'sessions');

	let creating = $state(false);
	let newTitle = $state('');
	let newTopic = $state('');
	let newNodeId = $state('');
	let saving = $state(false);

	const visibleSessions = $derived(
		sessions.filter((s) => matchesQuery(search, s.Title, s.Topic, s.NodeTitle))
	);
	const visibleQuestions = $derived(
		questions.filter((q) => matchesQuery(search, q.Source, q.SessionTitle))
	);

	async function load() {
		loading = true;
		error = '';
		try {
			[sessions, questions, nodes] = await Promise.all([
				learnApi.getSessions(),
				learnApi.getOpenQuestions(),
				knowledgeNodesApi.getAll()
			]);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load Learn sessions.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function createSession(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		error = '';
		try {
			const session = await learnApi.createSession({
				Title: newTitle.trim(),
				Topic: newTopic.trim() || undefined,
				NodeId: newNodeId ? Number(newNodeId) : undefined
			});
			goto(`/learn/${session.SessionId}`);
		} catch (err) {
			error =
				err instanceof DemoForbiddenError
					? err.message
					: err instanceof Error
						? err.message
						: 'Failed to create session.';
		} finally {
			saving = false;
		}
	}

	function questionText(source: string) {
		return parseSource(source).body.split('\n')[0];
	}
</script>

<div class="container">
	<div class="row-between">
		<h1>Learn</h1>
		{#if !creating}
			<button class="primary" onclick={() => (creating = true)} disabled={auth.isDemo}>
				New session
			</button>
		{/if}
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	{#if creating}
		<form class="card" onsubmit={createSession}>
			<div class="field">
				<label for="learn-title">Title</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input id="learn-title" type="text" bind:value={newTitle} maxlength="200" required autofocus />
			</div>
			<div class="field-row">
				<div class="field">
					<label for="learn-topic">Topic</label>
					<input id="learn-topic" type="text" bind:value={newTopic} maxlength="200" />
				</div>
				<div class="field">
					<label for="learn-node">Knowledge node <span class="muted">(where its logs are filed)</span></label>
					<select id="learn-node" bind:value={newNodeId}>
						<option value="">None</option>
						{#each [...nodes].sort((a, b) => a.Title.localeCompare(b.Title)) as node (node.Id)}
							<option value={String(node.Id)}>{node.Title}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="row">
				<button class="primary" type="submit" disabled={saving || !newTitle.trim()}>
					{saving ? 'Creating…' : 'Create'}
				</button>
				<button type="button" onclick={() => (creating = false)}>Cancel</button>
			</div>
		</form>
	{/if}

	<div class="views">
		<a href="/learn" class:active={view === 'sessions'}>Sessions</a>
		<a href="/learn?view=questions" class:active={view === 'questions'}>
			Open questions{questions.length ? ` (${questions.length})` : ''}
		</a>
		<input
			type="text"
			class="search"
			placeholder={view === 'sessions' ? 'Search sessions…' : 'Search questions…'}
			aria-label="Search"
			bind:value={search}
		/>
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if view === 'sessions'}
		{#if sessions.length === 0}
			<div class="empty-state">No sessions yet. Start one to build up a topic step by step.</div>
		{:else if visibleSessions.length === 0}
			<div class="empty-state">No sessions match "{search}".</div>
		{:else}
			{#each visibleSessions as session (session.SessionId)}
				<a class="card card-link session" href="/learn/{session.SessionId}">
					<div class="row-between">
						<strong>{session.Title}</strong>
						{#if session.OpenQuestionCount}
							<span class="tag-pill warn">{session.OpenQuestionCount} open</span>
						{/if}
					</div>
					<div class="muted">
						{[session.Topic, session.NodeTitle].filter(Boolean).join(' · ') || 'No topic'}
						· {session.EntryCount} {session.EntryCount === 1 ? 'entry' : 'entries'}
						· updated {new Date(session.UpdatedAt).toLocaleDateString()}
					</div>
				</a>
			{/each}
		{/if}
	{:else if questions.length === 0}
		<div class="empty-state">No open questions. Everything asked has a follow-up.</div>
	{:else if visibleQuestions.length === 0}
		<div class="empty-state">No questions match "{search}".</div>
	{:else}
		{#each visibleQuestions as q (q.EntryId)}
			<a class="card card-link question" href="/learn/{q.SessionId}#entry-{q.EntryId}">
				<em>{@html renderInlineMarkdown(questionText(q.Source))}</em>
				<div class="muted">{q.SessionTitle} · {new Date(q.CreatedAt).toLocaleDateString()}</div>
			</a>
		{/each}
	{/if}
</div>

<style>
	.views {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0.5rem 0 1rem;
		border-bottom: 1px solid var(--border);
	}
	.views a {
		color: var(--text-muted);
		padding: 0.5rem 0;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}
	.views a:hover {
		color: var(--text);
		text-decoration: none;
	}
	.views a.active {
		color: var(--text);
		border-bottom-color: var(--accent);
	}
	.search {
		margin-left: auto;
		max-width: 16rem;
		margin-bottom: 0.4rem;
	}
	.session .muted,
	.question .muted {
		margin-top: 0.3rem;
	}
	.tag-pill.warn {
		color: var(--warning);
		border-color: var(--warning);
	}
	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0 1rem;
	}
	@media (max-width: 640px) {
		.field-row {
			grid-template-columns: 1fr;
		}
		.search {
			margin-left: 0;
			max-width: none;
		}
	}
</style>
