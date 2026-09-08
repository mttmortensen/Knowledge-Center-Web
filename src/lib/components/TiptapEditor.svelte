<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import { Markdown, type MarkdownStorage } from 'tiptap-markdown';

	function markdownStorage(ed: Editor): MarkdownStorage {
		return (ed.storage as unknown as Record<string, unknown>).markdown as MarkdownStorage;
	}

	let {
		value = $bindable(''),
		placeholder = 'Write something…',
		editable = true,
		onImageUpload
	}: {
		value?: string;
		placeholder?: string;
		editable?: boolean;
		onImageUpload?: (file: File) => Promise<string>;
	} = $props();

	let element: HTMLDivElement;
	let editor = $state<Editor | undefined>(undefined);
	let mode = $state<'rich' | 'markdown'>('rich');
	let markdownDraft = $state(value);
	let fileInput: HTMLInputElement;
	let uploading = $state(false);

	onMount(() => {
		editor = new Editor({
			element,
			editable,
			extensions: [
				StarterKit.configure({ link: false }),
				Image,
				Link.configure({ openOnClick: false }),
				Placeholder.configure({ placeholder }),
				Markdown.configure({ html: false, transformPastedText: true })
			],
			content: value,
			onUpdate: ({ editor }) => {
				value = markdownStorage(editor).getMarkdown();
			},
			editorProps: {
				attributes: { class: 'tiptap-content' }
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	$effect(() => {
		editor?.setEditable(editable);
	});

	function toggleMode() {
		if (!editor) return;
		if (mode === 'rich') {
			markdownDraft = markdownStorage(editor).getMarkdown();
			mode = 'markdown';
		} else {
			editor.commands.setContent(markdownDraft);
			value = markdownDraft;
			mode = 'rich';
		}
	}

	function onMarkdownInput() {
		value = markdownDraft;
	}

	function triggerImagePick() {
		fileInput?.click();
	}

	async function handleFileChosen(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || !editor) return;

		if (!onImageUpload) {
			const url = prompt('Image URL:');
			if (url) editor.chain().focus().setImage({ src: url }).run();
			return;
		}

		uploading = true;
		try {
			const url = await onImageUpload(file);
			editor.chain().focus().setImage({ src: url }).run();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Image upload failed.');
		} finally {
			uploading = false;
		}
	}
</script>

<div class="editor-shell" class:readonly={!editable}>
	{#if editable}
	<div class="toolbar">
		{#if mode === 'rich' && editor}
			<button type="button" onclick={() => editor?.chain().focus().toggleBold().run()}>B</button>
			<button type="button" onclick={() => editor?.chain().focus().toggleItalic().run()}
				><em>i</em></button
			>
			<button type="button" onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				>H2</button
			>
			<button type="button" onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
				>H3</button
			>
			<button type="button" onclick={() => editor?.chain().focus().toggleBulletList().run()}
				>List</button
			>
			<button type="button" onclick={() => editor?.chain().focus().toggleOrderedList().run()}
				>1. List</button
			>
			<button type="button" onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
				>Code</button
			>
			<button type="button" onclick={() => editor?.chain().focus().toggleBlockquote().run()}
				>Quote</button
			>
			<button type="button" onclick={triggerImagePick} disabled={uploading}>
				{uploading ? 'Uploading…' : 'Image'}
			</button>
		{/if}
		<span style="flex: 1;"></span>
		<button type="button" onclick={toggleMode}>
			{mode === 'rich' ? 'Markdown' : 'Rich text'}
		</button>
	</div>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		style="display: none;"
		onchange={handleFileChosen}
	/>

	<div class:hidden={mode !== 'rich'} bind:this={element}></div>

	{#if mode === 'markdown'}
		<textarea
			class="markdown-textarea"
			bind:value={markdownDraft}
			oninput={onMarkdownInput}
			rows="16"
		></textarea>
	{/if}
</div>

<style>
	.editor-shell {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
		overflow: hidden;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--bg);
	}
	.toolbar button {
		padding: 0.3rem 0.6rem;
		font-size: 0.8rem;
	}
	.hidden {
		display: none;
	}
	.markdown-textarea {
		width: 100%;
		border: none;
		border-radius: 0;
		background: var(--bg-elevated);
		padding: 1rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.85rem;
		resize: vertical;
	}
	.markdown-textarea:focus {
		outline: none;
	}
	:global(.tiptap-content) {
		padding: 1rem;
		min-height: 300px;
		outline: none;
	}
	:global(.tiptap-content p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: var(--text-muted);
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(.tiptap-content img) {
		max-width: 100%;
		border-radius: 6px;
	}
	:global(.tiptap-content pre) {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.75rem;
		overflow-x: auto;
	}
	:global(.tiptap-content blockquote) {
		border-left: 3px solid var(--border);
		margin-left: 0;
		padding-left: 1rem;
		color: var(--text-muted);
	}
</style>
