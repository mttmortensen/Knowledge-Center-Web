<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { actionsApi } from '$lib/api/actions';

	const nodeId = $derived(Number(page.params.id));

	let actionText = $state('');
	let saving = $state(false);
	let error = $state('');

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!actionText.trim()) {
			error = 'Action text cannot be empty.';
			return;
		}
		saving = true;
		error = '';
		try {
			await actionsApi.create({ KnowledgeNodeId: nodeId, ActionText: actionText });
			goto(`/nodes/${nodeId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create action.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="container">
	<div class="breadcrumb"><a href="/nodes/{nodeId}">Back to node</a></div>
	<h1>New Action</h1>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<form onsubmit={save}>
		<div class="field">
			<label for="action-text">Action</label>
			<textarea id="action-text" rows="3" bind:value={actionText} required></textarea>
		</div>

		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Saving…' : 'Create action'}
		</button>
	</form>
</div>
