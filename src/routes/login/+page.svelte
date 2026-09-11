<script lang="ts">
	import { goto } from '$app/navigation';
	import { login, loginDemo } from '$lib/api/auth';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleLogin(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		submitting = true;
		try {
			await login(username, password);
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function handleDemoLogin() {
		error = '';
		submitting = true;
		try {
			await loginDemo();
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong when entering demo mode.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="login-wrap">
	<form class="card login-card" onsubmit={handleLogin}>
		<h1>Knowledge Center</h1>
		<p class="muted">Sign in to continue.</p>

		{#if error}
			<div class="error-banner">{error}</div>
		{/if}

		<div class="field">
			<label for="username">Username</label>
			<input id="username" type="text" bind:value={username} autocomplete="username" required />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				autocomplete="current-password"
				required
			/>
		</div>

		<button type="submit" class="primary" disabled={submitting} style="width: 100%;">
			{submitting ? 'Signing in…' : 'Sign in'}
		</button>

		<div class="divider"><span>or</span></div>

		<button type="button" onclick={handleDemoLogin} disabled={submitting} style="width: 100%;">
			Continue in demo mode
		</button>
	</form>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	.login-card {
		width: 100%;
		max-width: 360px;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 1.1rem 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}
</style>
