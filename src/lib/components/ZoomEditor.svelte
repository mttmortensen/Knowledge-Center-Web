<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { logEntriesApi } from '$lib/api/logEntries';
	import { actionsApi } from '$lib/api/actions';
	import { DemoForbiddenError } from '$lib/api/client';
	import type { LogEntry, ActionItem } from '$lib/types/api';

	type Mode = 'normal' | 'insert' | 'command';

	let {
		kind,
		logEntry,
		actionItem,
		domainName,
		nodeTitle,
		onClose,
		onSaved
	}: {
		kind: 'log' | 'action';
		logEntry?: LogEntry;
		actionItem?: ActionItem;
		domainName: string;
		nodeTitle: string;
		onClose: () => void;
		onSaved: (updated: LogEntry | ActionItem) => void;
	} = $props();

	const isLog = kind === 'log';
	// A log entry's buffer is [title, ...contentLines] — title is line 1 so
	// the whole editable surface (including the title) is one continuous
	// numbered buffer, matching how the rest of this view treats "the file"
	// as a flat list of lines. An action has no title, just its text.
	const lineOffset = isLog ? 1 : 0;

	let titleLine = $state(isLog ? (logEntry?.Title ?? '') : '');
	let bodyLines = $state<string[]>(
		(isLog ? (logEntry?.Content ?? '') : (actionItem?.ActionText ?? '')).split('\n')
	);
	let lineCount = $derived(lineOffset + bodyLines.length);

	function getLine(i: number): string {
		if (isLog && i === 0) return titleLine;
		return bodyLines[i - lineOffset] ?? '';
	}
	function setLine(i: number, value: string) {
		if (isLog && i === 0) {
			titleLine = value;
			return;
		}
		bodyLines[i - lineOffset] = value;
	}

	let mode = $state<Mode>('normal');
	let cursorLine = $state(0);
	let cursorCol = $state(1);
	let commandBuffer = $state('');
	let pendingG = $state(false);
	let pendingGTimer: ReturnType<typeof setTimeout> | undefined;
	let saving = $state(false);
	let flash = $state<string | null>(null);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	let error = $state('');

	let insertEl: HTMLTextAreaElement | undefined = $state();

	let now = $state(new Date());
	let clockTimer: ReturnType<typeof setInterval>;
	onMount(() => {
		clockTimer = setInterval(() => (now = new Date()), 1000);
	});
	onDestroy(() => {
		clearInterval(clockTimer);
		clearTimeout(pendingGTimer);
		clearTimeout(flashTimer);
	});

	$effect(() => {
		if (mode === 'insert') {
			insertEl?.focus();
			insertEl?.setSelectionRange(insertEl.value.length, insertEl.value.length);
		}
	});

	const dateLabel = new Date(
		isLog ? (logEntry?.EntryDate ?? Date.now()) : (actionItem?.CreatedAt ?? Date.now())
	).toLocaleDateString();

	let clockLabel = $derived(
		`${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
			`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
	);

	function flashMessage(msg: string) {
		flash = msg;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flash = null), 1200);
	}

	async function save() {
		saving = true;
		error = '';
		try {
			if (isLog && logEntry) {
				const newTitle = titleLine.trim() || undefined;
				const newContent = bodyLines.join('\n');
				await logEntriesApi.update(logEntry.LogId, { Title: newTitle, Content: newContent });
				onSaved({ ...logEntry, Title: newTitle, Content: newContent });
			} else if (!isLog && actionItem) {
				const newText = bodyLines.join('\n');
				await actionsApi.update(actionItem.Id, { ActionText: newText });
				onSaved({ ...actionItem, ActionText: newText });
			}
			flashMessage('SAVED');
		} catch (err) {
			if (err instanceof DemoForbiddenError) {
				flashMessage('READ-ONLY (DEMO)');
			} else {
				error = err instanceof Error ? err.message : 'Failed to save.';
				flashMessage('SAVE FAILED');
			}
		} finally {
			saving = false;
		}
	}

	function moveCursor(direction: 1 | -1) {
		cursorLine = Math.min(Math.max(cursorLine + direction, 0), lineCount - 1);
		cursorCol = 1;
	}

	function executeCommand(raw: string) {
		const cmd = raw.trim();
		if (cmd === 'w') {
			save();
		} else if (cmd === 'q') {
			onClose();
		} else if (cmd === 'wq' || cmd === 'x') {
			save().then(onClose);
		}
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (mode === 'insert') return; // the textarea handles its own keys

		if (mode === 'command') {
			if (e.key === 'Escape') {
				e.preventDefault();
				mode = 'normal';
				commandBuffer = '';
			} else if (e.key === 'Enter') {
				e.preventDefault();
				executeCommand(commandBuffer);
				commandBuffer = '';
				mode = 'normal';
			} else if (e.key === 'Backspace') {
				e.preventDefault();
				commandBuffer = commandBuffer.slice(0, -1);
			} else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
				e.preventDefault();
				commandBuffer += e.key;
			}
			return;
		}

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'i') {
			e.preventDefault();
			mode = 'insert';
		} else if (e.key === ':') {
			e.preventDefault();
			commandBuffer = '';
			mode = 'command';
		} else if (e.key === 'ArrowDown' || e.key === 'j') {
			e.preventDefault();
			moveCursor(1);
		} else if (e.key === 'ArrowUp' || e.key === 'k') {
			e.preventDefault();
			moveCursor(-1);
		} else if (e.key === 'G') {
			e.preventDefault();
			cursorLine = lineCount - 1;
			cursorCol = 1;
		} else if (e.key === 'g') {
			e.preventDefault();
			if (pendingG) {
				cursorLine = 0;
				cursorCol = 1;
				pendingG = false;
				clearTimeout(pendingGTimer);
			} else {
				pendingG = true;
				clearTimeout(pendingGTimer);
				pendingGTimer = setTimeout(() => (pendingG = false), 500);
			}
		}
	}

	function onInsertKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			// Without stopPropagation, this same event bubbles to the window
			// listener right after mode flips to 'normal' here — and since
			// that handler reads the now-already-updated mode, it treats it
			// as a second, normal-mode Escape and closes the whole zoom.
			e.preventDefault();
			e.stopPropagation();
			mode = 'normal';
		} else if (e.key === 'Enter') {
			// This buffer models one array entry per line rather than a real
			// multi-line text engine, so there's no "split into a new line"
			// operation — Enter commits the same way Escape does.
			e.preventDefault();
			e.stopPropagation();
			mode = 'normal';
		}
	}

	function updateCursorCol(e: Event) {
		const el = e.currentTarget as HTMLTextAreaElement;
		cursorCol = (el.selectionStart ?? 0) + 1;
	}

	const modeLabel = $derived(mode === 'insert' ? 'INSERT' : mode === 'command' ? 'COMMAND' : 'NORMAL');
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="zoom">
	<div class="zoom-topbar">
		<span class="breadcrumb"
			>{domainName} / {nodeTitle} / {kind}
			{dateLabel}</span
		>
		<span class="zoom-clock">{clockLabel}</span>
	</div>

	<div class="zoom-body">
		{#if error}
			<div class="error-banner">{error}</div>
		{/if}
		<div class="buffer">
			{#each { length: lineCount } as _, i (i)}
				<div
					class="buf-line"
					class:cursor={i === cursorLine}
					onclick={() => {
						if (mode === 'normal') cursorLine = i;
					}}
				>
					<span class="gutter">{i + 1}</span>
					{#if mode === 'insert' && i === cursorLine}
						<textarea
							bind:this={insertEl}
							class="buf-input"
							value={getLine(i)}
							oninput={(e) => {
								setLine(i, e.currentTarget.value);
								updateCursorCol(e);
							}}
							onkeydown={onInsertKeydown}
							onkeyup={updateCursorCol}
							onclick={updateCursorCol}
							rows="1"
						></textarea>
					{:else}
						<span class="buf-text">{getLine(i) || ' '}</span>
					{/if}
				</div>
			{/each}
		</div>

		{#if isLog && logEntry && logEntry.Tags.length > 0}
			<div class="zoom-tags">
				{#each logEntry.Tags as tag (tag.TagId)}
					<span class="tag-pill">{tag.Name}</span>
				{/each}
			</div>
		{/if}
	</div>

	<div class="zoom-modeline">
		{#if mode === 'command'}
			<span class="mode-label command-line">:{commandBuffer}</span>
		{:else}
			<span class="mode-label">-- {modeLabel} --</span>
		{/if}
		<span class="cursor-pos">{flash ?? `${cursorLine + 1},${cursorCol}`}</span>
		<span class="mode-hints">i insert&nbsp;&nbsp;&nbsp;:w save&nbsp;&nbsp;&nbsp;esc exit</span>
	</div>
</div>

<style>
	.zoom {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		flex-direction: column;
		background: var(--bg);
		font-family: var(--font);
	}

	.zoom-topbar {
		flex-shrink: 0;
		height: var(--statusbar-h);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.6rem;
		background: var(--bg-panel-header);
		border-bottom: 1px solid var(--gray);
		font-size: 0.8rem;
	}
	.breadcrumb {
		color: var(--cyan);
	}
	.zoom-clock {
		color: var(--white);
		flex-shrink: 0;
	}

	.zoom-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 0 2rem;
	}

	.error-banner {
		margin: 0 1rem 0.75rem;
	}

	.buffer {
		display: flex;
		flex-direction: column;
	}
	.buf-line {
		display: flex;
		align-items: flex-start;
		padding: 0.05rem 0.75rem;
		cursor: default;
	}
	.buf-line.cursor {
		background: var(--gray);
		color: var(--bios-blue-dark);
	}
	.gutter {
		flex-shrink: 0;
		width: 2.5rem;
		color: #555599;
		user-select: none;
		text-align: right;
		margin-right: 1rem;
	}
	.buf-line.cursor .gutter {
		color: var(--bios-blue-dark);
		opacity: 0.7;
	}
	.buf-text {
		white-space: pre-wrap;
		word-break: break-word;
		flex: 1;
	}
	.buf-input {
		flex: 1;
		background: var(--select-bg);
		color: var(--select-text);
		border: none;
		padding: 0;
		margin: 0;
		font-family: var(--font);
		font-size: inherit;
		line-height: inherit;
		resize: none;
		overflow: hidden;
		min-height: 1.4em;
		field-sizing: content;
	}
	.buf-input:focus {
		outline: none;
	}

	.zoom-tags {
		margin: 1rem 0.75rem 0;
		padding-top: 0.6rem;
		border-top: 1px solid var(--cyan-dim);
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.zoom-modeline {
		flex-shrink: 0;
		height: var(--footerbar-h);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 0.6rem;
		background: var(--bg-panel-header);
		border-top: 1px solid var(--gray);
		font-size: 0.8rem;
		position: relative;
	}
	.mode-label {
		color: var(--yellow);
		flex-shrink: 0;
		font-weight: 700;
	}
	.command-line {
		font-weight: 400;
	}
	.cursor-pos {
		color: var(--cyan-dim);
	}
	.mode-hints {
		color: var(--cyan-dim);
		flex-shrink: 0;
		white-space: nowrap;
	}
</style>
