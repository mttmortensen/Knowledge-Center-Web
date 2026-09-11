<script lang="ts">
	import { footer } from '$lib/stores/footer.svelte';
</script>

<div class="footer-bar">
	{#each footer.hints as hint (hint.key)}
		<span class="hint">
			<span class="key">{hint.key}</span>
			<span class="hint-label">{hint.label}</span>
		</span>
	{/each}
</div>
