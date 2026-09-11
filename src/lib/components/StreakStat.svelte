<script lang="ts">
	let {
		currentStreak,
		longestStreak,
		lastEntryDate,
		label = 'entry'
	}: {
		currentStreak: number;
		longestStreak: number;
		lastEntryDate: string | null;
		label?: string;
	} = $props();

	function formatDate(value: string): string {
		return new Date(value).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="streak-stat">
	<div class="streak-figure">
		<span class="streak-value">{currentStreak}</span>
		<span class="muted">day{currentStreak === 1 ? '' : 's'} current streak</span>
	</div>
	<div class="streak-figure">
		<span class="streak-value">{longestStreak}</span>
		<span class="muted">day{longestStreak === 1 ? '' : 's'} longest streak</span>
	</div>
	<span class="muted last-entry">
		{lastEntryDate ? `Last ${label} on ${formatDate(lastEntryDate)}` : `No ${label} yet`}
	</span>
</div>

<style>
	.streak-stat {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.streak-figure {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.streak-value {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.last-entry {
		margin-left: auto;
	}
</style>
