<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// The standalone Actions list moved into Browse's third column (per-node
	// sub-pane). This route is kept only so existing links (e.g. Dashboard's
	// "F4 view all") don't 404 — see +page.svelte.disabled for the old page.
	onMount(() => {
		goto('/domains', { replaceState: true });
	});
</script>
