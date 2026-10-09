<script lang="ts">
	import { tick } from 'svelte';
	import { learnApi } from '$lib/api/learn';
	import { uploadImage } from '$lib/api/images';
	import { ApiError } from '$lib/api/client';
	import { linkEntries, parseSource } from '$lib/learn/parse';
	import { renderMarkdown } from '$lib/learn/render';
	import type { LearnEntry } from '$lib/types/api';

	// One continuous sheet: entries render as formatted markdown, clicking one
	// swaps it for a raw-markdown textarea, clicking the gap between entries (or
	// the empty space below them) starts a new one. No toolbars or buttons —
	// the margin gutter's timestamps and link tags are the only extra marks.

	let {
		sessionId,
		entries = $bindable([]),
		openOnly = $bindable(false),
		readonly = false
	}: {
		sessionId: number;
		entries: LearnEntry[];
		openOnly?: boolean;
		readonly?: boolean;
	} = $props();

	type Editing = { kind: 'entry'; id: number } | { kind: 'new'; beforeId: number | null };

	let editing = $state<Editing | null>(null);
	let draft = $state('');
	let error = $state<{ key: string; message: string } | null>(null);
	let textarea = $state<HTMLTextAreaElement>();
	/** A save that failed after the user had already moved on to another entry. */
	let stranded = $state<{ target: Editing; text: string; message: string } | null>(null);
	let highlighted = $state<number | null>(null);
	let highlightTimer: ReturnType<typeof setTimeout> | undefined;
	let tempId = 0;

	const links = $derived(linkEntries(entries));
	const indexById = $derived(new Map(entries.map((e, i) => [e.EntryId, i])));
	const visible = $derived(
		openOnly ? entries.filter((e) => links.get(e.EntryId)?.questionStatus === 'open') : entries
	);
	const editKey = $derived(keyOf(editing));

	function keyOf(e: Editing | null): string | null {
		if (!e) return null;
		return e.kind === 'entry' ? `entry-${e.id}` : `new-${e.beforeId ?? 'end'}`;
	}

	/* ===================== EDITING ===================== */

	/**
	 * Called before opening another entry. Normally the open one has already
	 * committed on blur, but if blur never fired (some mobile browsers keep focus
	 * when tapping plain content) commit it now rather than drop the text. An entry
	 * with a problem stays open until it's fixed or cleared.
	 */
	function blocked() {
		if (editing && error?.key !== editKey) commit();
		if (editing) {
			textarea?.focus();
			return true;
		}
		return false;
	}

	function startEdit(entry: LearnEntry) {
		if (readonly || entry.EntryId < 0 || blocked()) return;
		draft = entry.Source;
		error = null;
		editing = { kind: 'entry', id: entry.EntryId };
	}

	function startNew(beforeId: number | null) {
		if (readonly || blocked()) return;
		draft = '';
		error = null;
		editing = { kind: 'new', beforeId };
	}

	/**
	 * Catches what the API would reject before leaving edit mode, so the text is
	 * still in front of the user to fix. The API re-checks everything.
	 */
	function localProblem(target: Editing, text: string): string | null {
		if (!text.trim()) return null;

		const parsed = parseSource(text);
		const answersId = parsed.answersEntryId;
		const previous = target.kind === 'entry' ? links.get(target.id)?.parsed.answersEntryId : null;
		if (answersId !== null && answersId !== previous) {
			if (target.kind === 'entry' && answersId === target.id) return 'An entry cannot answer itself.';
			if (!indexById.has(answersId)) return `@answers(${answersId}): there's no entry #${answersId} in this session.`;
		}
		return null;
	}

	async function commit() {
		const current = editing;
		const text = draft;
		if (!current) return;

		const problem = localProblem(current, text);
		if (problem) {
			error = { key: keyOf(current)!, message: problem };
			await tick();
			textarea?.focus();
			return;
		}

		editing = null;
		error = null;

		if (current.kind === 'entry') await commitExisting(current.id, text);
		else await commitNew(current.beforeId, text);
	}

	async function commitExisting(id: number, rawText: string) {
		const entry = entries.find((e) => e.EntryId === id);
		if (!entry) return;

		try {
			const text = await resolveUploads(rawText);

			// Clearing an entry deletes it.
			if (!text.trim()) return await removeEntry(entry);
			if (text === entry.Source) return;

			replaceLocal(id, { ...entry, Source: text });
			try {
				replaceLocal(id, await learnApi.updateEntry(id, text));
			} catch (err) {
				replaceLocal(id, entry);
				throw err;
			}
		} catch (err) {
			await reopen({ kind: 'entry', id }, rawText, err);
		}
	}

	async function commitNew(beforeId: number | null, rawText: string) {
		const placeholderId = --tempId;
		try {
			const text = await resolveUploads(rawText);
			if (!text.trim()) return;

			insertLocal(placeholderEntry(placeholderId, text), beforeId);

			const created = await learnApi.createEntry(sessionId, {
				Source: text,
				BeforeEntryId: beforeId ?? undefined
			});
			replaceLocal(placeholderId, created);
		} catch (err) {
			removeLocal(placeholderId);
			await reopen({ kind: 'new', beforeId }, rawText, err);
		}
	}

	async function removeEntry(entry: LearnEntry) {
		const index = entries.findIndex((e) => e.EntryId === entry.EntryId);
		removeLocal(entry.EntryId);
		try {
			await learnApi.deleteEntry(entry.EntryId);
		} catch (err) {
			entries.splice(index, 0, entry);
			throw err;
		}
	}

	async function reopen(target: Editing, text: string, err: unknown) {
		const message = err instanceof Error ? err.message : 'Could not save this entry.';

		// The user may already be editing something else; don't steal focus from
		// that, but don't drop the unsaved text either.
		if (editing) {
			stranded = { target, text, message };
			return;
		}
		draft = text;
		editing = target;
		error = { key: keyOf(target)!, message };
		await tick();
	}

	function restoreStranded() {
		if (!stranded || blocked()) return;
		let { target } = stranded;
		// The entry it was going above may have been deleted since; append instead.
		if (target.kind === 'new' && target.beforeId !== null && !indexById.has(target.beforeId)) {
			target = { kind: 'new', beforeId: null };
		}
		if (target.kind === 'entry' && !indexById.has(target.id)) {
			target = { kind: 'new', beforeId: null };
		}
		draft = stranded.text;
		error = { key: keyOf(target)!, message: stranded.message };
		editing = target;
		stranded = null;
	}

	function placeholderEntry(id: number, source: string): LearnEntry {
		const now = new Date().toISOString();
		const parsed = parseSource(source);
		return {
			EntryId: id,
			SessionId: sessionId,
			Position: 0,
			Source: source,
			CreatedAt: now,
			UpdatedAt: now,
			EntryType: parsed.type,
			QuestionStatus: null,
			AnswersEntryId: parsed.answersEntryId
		};
	}

	function insertLocal(entry: LearnEntry, beforeId: number | null) {
		const index = beforeId == null ? -1 : entries.findIndex((e) => e.EntryId === beforeId);
		entries.splice(index === -1 ? entries.length : index, 0, entry);
	}

	function replaceLocal(id: number, entry: LearnEntry) {
		const index = entries.findIndex((e) => e.EntryId === id);
		if (index !== -1) entries[index] = entry;
	}

	function removeLocal(id: number) {
		const index = entries.findIndex((e) => e.EntryId === id);
		if (index !== -1) entries.splice(index, 1);
	}

	function onRowClick(event: MouseEvent, entry: LearnEntry) {
		const target = event.target as HTMLElement;
		if (target.closest('a, button, textarea')) return;
		// Selecting text to copy it shouldn't flip the entry into edit mode.
		if (window.getSelection()?.toString()) return;

		if (openOnly) jump(entry.EntryId);
		else startEdit(entry);
	}

	function onRowKey(event: KeyboardEvent, entry: LearnEntry) {
		if (event.key === 'Enter' && event.target === event.currentTarget) {
			event.preventDefault();
			startEdit(entry);
		}
	}

	function onEditorKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			(event.currentTarget as HTMLTextAreaElement).blur();
		}
	}

	/** Grows the textarea with its content; focuses it with the caret at the end. */
	function autogrow(node: HTMLTextAreaElement, _value: string) {
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		};
		resize();
		node.focus();
		node.setSelectionRange(node.value.length, node.value.length);
		return { update: resize };
	}

	/* ===================== @answers SUGGESTIONS ===================== */

	// While the first line reads "@answers(" (optionally with a partial id), offer
	// this session's questions so the id doesn't have to be looked up.
	const answersQuery = $derived(
		editing ? /^\s*@answers\((\d*)$/.exec(draft.split('\n')[0])?.[1] ?? null : null
	);
	const suggestions = $derived.by(() => {
		if (answersQuery === null) return [];
		return entries
			.filter((e) => e.EntryId > 0 && links.get(e.EntryId)?.parsed.type === 'question')
			.filter((e) => String(e.EntryId).startsWith(answersQuery))
			.sort((a, b) => {
				const openA = links.get(a.EntryId)?.questionStatus === 'open' ? 0 : 1;
				const openB = links.get(b.EntryId)?.questionStatus === 'open' ? 0 : 1;
				return openA - openB || b.EntryId - a.EntryId;
			})
			.slice(0, 6);
	});

	function pickSuggestion(entryId: number) {
		const [first, ...rest] = draft.split('\n');
		const replaced = first.replace(/@answers\(\d*$/, `@answers(${entryId}) `);
		draft = [replaced, ...rest].join('\n');
	}

	/* ===================== IMAGES ===================== */

	// Pasted/dropped images upload through the app's existing /images endpoint and
	// land as ![](url); the caption goes between the brackets. Until the upload
	// finishes a placeholder holds the spot, and a commit waits for it.
	const uploads = new Map<string, Promise<string>>();
	let uploadCount = 0;

	function insertImages(files: File[], textarea: HTMLTextAreaElement) {
		for (const file of files) {
			const placeholder = `![Uploading image ${++uploadCount}…]()`;
			const before = draft.slice(0, textarea.selectionStart);
			const after = draft.slice(textarea.selectionEnd);
			const lead = before && !before.endsWith('\n') ? '\n' : '';
			const trail = after && !after.startsWith('\n') ? '\n' : '';
			draft = before + lead + placeholder + trail + after;

			const upload = uploadImage(file)
				.then((url) => `![](${url})`)
				.catch((err) => {
					error = {
						key: editKey ?? '',
						message: err instanceof ApiError ? err.message : 'Image upload failed.'
					};
					return '';
				});
			uploads.set(placeholder, upload);
			upload.then((markdown) => {
				if (draft.includes(placeholder)) draft = draft.replace(placeholder, markdown);
			});
		}
	}

	async function resolveUploads(text: string): Promise<string> {
		for (const [placeholder, upload] of uploads) {
			if (text.includes(placeholder)) text = text.replace(placeholder, await upload);
		}
		return text;
	}

	function imageFiles(list: FileList | undefined | null): File[] {
		return [...(list ?? [])].filter((f) => f.type.startsWith('image/'));
	}

	function onPaste(event: ClipboardEvent) {
		const files = imageFiles(event.clipboardData?.files);
		if (!files.length) return;
		event.preventDefault();
		insertImages(files, event.currentTarget as HTMLTextAreaElement);
	}

	function onDrop(event: DragEvent) {
		const files = imageFiles(event.dataTransfer?.files);
		if (!files.length) return;
		event.preventDefault();
		insertImages(files, event.currentTarget as HTMLTextAreaElement);
	}

	/* ===================== MARGIN ===================== */

	export async function jump(entryId: number) {
		if (openOnly) {
			openOnly = false;
			await tick();
		}
		document
			.getElementById(`entry-${entryId}`)
			?.scrollIntoView({ behavior: 'smooth', block: 'center' });

		highlighted = null;
		await tick();
		highlighted = entryId;
		clearTimeout(highlightTimer);
		highlightTimer = setTimeout(() => (highlighted = null), 1600);
	}

	function dayKey(iso: string) {
		return new Date(iso).toDateString();
	}

	function shortTime(iso: string) {
		return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}

	function shortDate(iso: string) {
		return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
	}

	/** "answered ↓" points the way to the (first) follow-up. */
	function answeredArrow(questionId: number, followUpId: number) {
		return (indexById.get(followUpId) ?? 0) > (indexById.get(questionId) ?? 0) ? '↓' : '↑';
	}
</script>

{#snippet editor(key: string)}
	<div class="editor">
		<textarea
			class="source"
			bind:this={textarea}
			bind:value={draft}
			use:autogrow={draft}
			onblur={commit}
			onkeydown={onEditorKey}
			onpaste={onPaste}
			ondrop={onDrop}
			spellcheck="true"
			rows="1"
			placeholder="Markdown. ?? asks a question, @answers(id) follows up."
		></textarea>
		{#if suggestions.length}
			<ul class="suggestions">
				{#each suggestions as q (q.EntryId)}
					<li>
						<!-- mousedown + preventDefault keeps the textarea focused (no blur/commit). -->
						<button
							type="button"
							onmousedown={(e) => {
								e.preventDefault();
								pickSuggestion(q.EntryId);
							}}
						>
							<span class="ref">#{q.EntryId}</span>
							<span class:open={links.get(q.EntryId)?.questionStatus === 'open'}>
								{links.get(q.EntryId)?.parsed.body.split('\n')[0]}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		{#if error?.key === key}
			<p class="row-error">{error.message}</p>
		{/if}
	</div>
{/snippet}

{#snippet draftRow(key: string)}
	<div class="entry editing">
		<div class="gutter"><span class="time">new</span></div>
		<div class="body">{@render editor(key)}</div>
	</div>
{/snippet}

<div class="sheet" class:readonly>
	{#if stranded}
		<div class="stranded" role="alert">
			Couldn't save an entry: {stranded.message}
			<button type="button" class="tag" onclick={restoreStranded}>Reopen it</button>
		</div>
	{/if}

	{#each visible as entry, i (entry.EntryId)}
		{@const link = links.get(entry.EntryId)}
		{@const parsed = link?.parsed ?? parseSource(entry.Source)}
		{@const key = `entry-${entry.EntryId}`}
		{@const prev = visible[i - 1]}

		{#if !readonly && !openOnly}
			<div
				class="gap"
				role="button"
				tabindex="-1"
				aria-label="Insert an entry here"
				onclick={() => startNew(entry.EntryId)}
				onkeydown={(e) => e.key === 'Enter' && startNew(entry.EntryId)}
			></div>
		{/if}

		{#if editing?.kind === 'new' && editing.beforeId === entry.EntryId}
			{@render draftRow(keyOf(editing)!)}
		{/if}

		<div
			class="entry"
			class:editing={editKey === key}
			class:flash={highlighted === entry.EntryId}
			class:pending={entry.EntryId < 0}
			id="entry-{entry.EntryId}"
			role="button"
			tabindex="0"
			onclick={(e) => onRowClick(e, entry)}
			onkeydown={(e) => onRowKey(e, entry)}
		>
			<div class="gutter">
				{#if !prev || dayKey(prev.CreatedAt) !== dayKey(entry.CreatedAt)}
					<span class="date">{shortDate(entry.CreatedAt)}</span>
				{/if}
				<time class="time" datetime={entry.CreatedAt} title={new Date(entry.CreatedAt).toLocaleString()}>
					{shortTime(entry.CreatedAt)}
				</time>

				{#if link?.questionStatus === 'open'}
					<span class="tag warn">open</span>
				{:else if link?.questionStatus === 'answered'}
					<button type="button" class="tag" onclick={() => jump(link.answeredBy[0])}>
						answered {answeredArrow(entry.EntryId, link.answeredBy[0])}
					</button>
				{/if}

				{#if parsed.type === 'followup' && parsed.answersEntryId != null}
					{#if link?.targetExists}
						<button type="button" class="tag" onclick={() => jump(parsed.answersEntryId!)}>↩ answers</button>
					{:else}
						<span class="tag faint" title="The entry this answered was deleted">↩ deleted</span>
					{/if}
				{/if}

				{#if entry.EntryId > 0}
					<span class="ref">#{entry.EntryId}</span>
				{/if}
			</div>

			<div class="body">
				{#if editKey === key}
					{@render editor(key)}
				{:else}
					<div class="md" class:question={parsed.type === 'question'}>
						{@html renderMarkdown(parsed.body)}
					</div>
				{/if}
			</div>
		</div>
	{/each}

	{#if editing?.kind === 'new' && editing.beforeId === null}
		{@render draftRow(keyOf(editing)!)}
	{/if}

	{#if openOnly && visible.length === 0}
		<p class="empty faint-text">No open questions in this session.</p>
	{:else if !readonly && !openOnly}
		<div
			class="tail"
			role="button"
			tabindex="0"
			aria-label="Add an entry at the end"
			onclick={() => startNew(null)}
			onkeydown={(e) => e.key === 'Enter' && startNew(null)}
		>
			{#if entries.length === 0 && !editing}
				<span class="faint-text">Click anywhere to start writing.</span>
			{/if}
		</div>
	{:else if entries.length === 0}
		<p class="empty faint-text">This session has no entries yet.</p>
	{/if}
</div>

<style>
	.sheet {
		--gutter: 50px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem 0.75rem 0;
		min-height: 60vh;
		display: flex;
		flex-direction: column;
	}
	.sheet.readonly {
		padding-bottom: 0.75rem;
	}

	/* === rows === */
	.entry {
		display: grid;
		grid-template-columns: var(--gutter) minmax(0, 1fr);
		gap: 0.75rem;
		padding: 0.3rem 0.5rem;
		border-radius: 6px;
		outline: none;
		transition: background-color 0.4s;
	}
	.sheet:not(.readonly) .entry {
		cursor: text;
	}
	.entry:focus-visible {
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	@media (hover: hover) {
		.entry:hover {
			background: var(--bg-hover);
		}
	}
	.entry.editing,
	.entry.editing:hover {
		background: transparent;
	}
	.entry.pending {
		opacity: 0.6;
	}
	.entry.flash {
		animation: flash 1.6s ease-out;
	}
	@keyframes flash {
		0%,
		30% {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
		}
		100% {
			background: transparent;
		}
	}

	/* === insert zones === */
	.gap {
		height: 8px;
		margin: 0 0.5rem;
		cursor: text;
		border-radius: 4px;
		outline: none;
	}
	@media (hover: hover) {
		.gap:hover {
			background: var(--bg-hover);
		}
	}
	@media (pointer: coarse) {
		.gap {
			height: 16px;
		}
	}
	.tail {
		flex: 1;
		min-height: 30vh;
		cursor: text;
		padding: 0.5rem 0.5rem 0.5rem calc(var(--gutter) + 1.25rem);
		outline: none;
	}

	/* === gutter === */
	.gutter {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		padding-top: 0.2rem;
		font-size: 0.7rem;
		line-height: 1.3;
		color: var(--text-muted);
		user-select: none;
	}
	.date {
		font-weight: 600;
		color: var(--text);
	}
	.tag {
		all: unset;
		font-size: 0.68rem;
		color: var(--accent);
		cursor: pointer;
		white-space: nowrap;
	}
	.tag:hover {
		text-decoration: underline;
	}
	.tag:focus-visible {
		outline: 1px solid var(--accent);
	}
	.tag.warn {
		color: var(--warning);
		cursor: default;
		text-decoration: none;
	}
	.tag.faint {
		color: var(--text-muted);
		cursor: default;
		text-decoration: none;
	}
	.ref {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.65rem;
		color: var(--text-muted);
		opacity: 0;
		transition: opacity 0.15s;
	}
	.entry:hover .ref,
	.entry.editing .ref,
	.entry:focus-visible .ref {
		opacity: 0.7;
	}
	@media (hover: none) {
		.ref {
			opacity: 0.5;
		}
	}

	/* === body === */
	.body {
		min-width: 0;
		line-height: 1.6;
		overflow-wrap: anywhere;
	}
	.faint-text {
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	.empty {
		padding: 1.5rem 0.5rem;
		text-align: center;
	}

	.md :global(> :first-child) {
		margin-top: 0;
	}
	.md :global(> :last-child) {
		margin-bottom: 0;
	}
	.md :global(p) {
		margin: 0 0 0.6rem;
	}
	.md :global(h1),
	.md :global(h2),
	.md :global(h3),
	.md :global(h4) {
		margin: 0.4rem 0 0.4rem;
		line-height: 1.3;
	}
	.md :global(h1) {
		font-size: 1.4rem;
	}
	.md :global(h2) {
		font-size: 1.2rem;
	}
	.md :global(h3) {
		font-size: 1.05rem;
	}
	.md :global(ul),
	.md :global(ol) {
		margin: 0 0 0.6rem;
		padding-left: 1.4rem;
	}
	.md :global(blockquote) {
		margin: 0 0 0.6rem;
		padding-left: 0.8rem;
		border-left: 3px solid var(--border);
		color: var(--text-muted);
	}
	.md :global(code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.85em;
		background: var(--bg-hover);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.05rem 0.3rem;
	}
	.md :global(pre) {
		margin: 0 0 0.6rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.7rem 0.85rem;
		overflow-x: auto;
	}
	.md :global(pre code) {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.85rem;
	}
	.md :global(table) {
		border-collapse: collapse;
		margin: 0 0 0.6rem;
		display: block;
		overflow-x: auto;
	}
	.md :global(th),
	.md :global(td) {
		border: 1px solid var(--border);
		padding: 0.25rem 0.5rem;
	}
	.md :global(.learn-figure) {
		display: block;
		margin: 0.2rem 0 0.6rem;
	}
	.md :global(.learn-figure img) {
		display: block;
		max-width: 100%;
		max-height: 70vh;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.md :global(.learn-caption) {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.8rem;
		color: var(--text-muted);
		text-align: center;
	}
	.md.question {
		font-style: italic;
	}

	/* === editor === */
	.source {
		display: block;
		width: 100%;
		min-height: 1.6em;
		resize: none;
		overflow: hidden;
		background: transparent;
		border: none;
		border-left: 2px solid var(--accent);
		border-radius: 0;
		padding: 0 0 0 0.6rem;
		margin-left: calc(-0.6rem - 2px);
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.88rem;
		line-height: 1.6;
	}
	.source:focus {
		outline: none;
	}
	.stranded {
		margin: 0 0 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--danger);
		border-radius: 6px;
		color: var(--danger);
		font-size: 0.85rem;
	}
	.stranded .tag {
		margin-left: 0.5rem;
		font-size: 0.85rem;
	}
	.row-error {
		margin: 0.35rem 0 0;
		color: var(--danger);
		font-size: 0.8rem;
	}
	.suggestions {
		list-style: none;
		margin: 0.35rem 0 0;
		padding: 0.25rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		max-width: 32rem;
	}
	.suggestions button {
		all: unset;
		box-sizing: border-box;
		display: flex;
		gap: 0.5rem;
		width: 100%;
		padding: 0.3rem 0.45rem;
		border-radius: 4px;
		font-size: 0.85rem;
		cursor: pointer;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.suggestions button:hover {
		background: var(--bg-hover);
	}
	.suggestions .ref {
		opacity: 1;
	}
	.suggestions .open {
		color: var(--warning);
	}

	@media (max-width: 640px) {
		.sheet {
			--gutter: 42px;
			padding: 0.5rem 0.25rem 0;
			margin: 0 -0.35rem;
		}
		.entry {
			gap: 0.55rem;
			padding: 0.3rem 0.4rem;
		}
	}
</style>
