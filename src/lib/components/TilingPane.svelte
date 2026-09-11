<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		index,
		title,
		focused = false,
		onFocus,
		actions,
		children
	}: {
		index: number;
		title: string;
		focused?: boolean;
		onFocus?: () => void;
		actions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="pane" class:focused role="group" aria-label={title} onclick={onFocus} onfocusin={onFocus}>
	<div class="pane-header">
		<span><span class="pane-index">{index}</span>{title}</span>
		{#if actions}
			<div class="pane-actions">{@render actions()}</div>
		{/if}
	</div>
	<div class="pane-body">
		{@render children()}
	</div>
</section>
