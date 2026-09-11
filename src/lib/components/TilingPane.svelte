<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		index,
		title,
		focused = false,
		onFocus,
		actions,
		children,
		flex
	}: {
		index: number | string;
		title: string;
		focused?: boolean;
		onFocus?: () => void;
		actions?: Snippet;
		children: Snippet;
		/** CSS flex-grow share for stacking this pane with siblings (e.g. the
		 * two sub-panes inside the Browse workspace's third column). Omit for
		 * a pane that fills its own grid cell. */
		flex?: number;
	} = $props();
</script>

<section
	class="pane"
	class:focused
	style={flex !== undefined ? `flex: ${flex} 1 0; min-height: 0;` : undefined}
	role="group"
	aria-label={title}
	onclick={onFocus}
	onfocusin={onFocus}
>
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
