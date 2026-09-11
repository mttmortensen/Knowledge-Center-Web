<script lang="ts">
	let {
		currentStreak,
		longestStreak,
		totalCount,
		totalSingular,
		totalPlural
	}: {
		currentStreak: number;
		longestStreak: number;
		totalCount: number;
		totalSingular: string;
		totalPlural: string;
	} = $props();
</script>

<p class="streak-stat">
	{currentStreak} day{currentStreak === 1 ? '' : 's'} streak, best {longestStreak}
	-- {totalCount} {totalCount === 1 ? totalSingular : totalPlural}
</p>

<style>
	.streak-stat {
		margin: 0 0 0.5rem;
		color: var(--text);
	}
</style>
