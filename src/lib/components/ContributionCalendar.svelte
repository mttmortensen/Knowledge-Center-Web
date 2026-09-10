<script lang="ts">
	import type { CtpDayCount } from '$lib/types/api';

	let { data }: { data: CtpDayCount[] } = $props();

	const WEEKS = 53;

	interface Day {
		date: Date;
		key: string;
		count: number;
		level: number;
	}

	function dateKey(year: number, month: number, day: number): string {
		return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	function levelFor(count: number): number {
		if (count <= 0) return 0;
		if (count === 1) return 1;
		if (count === 2) return 2;
		if (count === 3) return 3;
		return 4;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	let weeks = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of data) {
			counts.set(entry.Date.slice(0, 10), entry.Count);
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const start = new Date(today);
		start.setDate(start.getDate() - (WEEKS * 7 - 1));
		start.setDate(start.getDate() - start.getDay());

		const result: Day[][] = [];
		let column: Day[] = [];
		let cursor = new Date(start);

		while (cursor <= today) {
			const key = dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
			const count = counts.get(key) ?? 0;
			column.push({ date: new Date(cursor), key, count, level: levelFor(count) });

			if (cursor.getDay() === 6) {
				result.push(column);
				column = [];
			}
			cursor = new Date(cursor);
			cursor.setDate(cursor.getDate() + 1);
		}
		if (column.length > 0) result.push(column);

		return result;
	});

	let monthLabels = $derived.by(() => {
		const labels: { index: number; label: string }[] = [];
		let lastMonth = -1;

		weeks.forEach((week, index) => {
			const firstDay = week[0];
			if (!firstDay) return;

			const month = firstDay.date.getMonth();
			if (month !== lastMonth) {
				labels.push({ index, label: firstDay.date.toLocaleString(undefined, { month: 'short' }) });
				lastMonth = month;
			}
		});

		return labels;
	});

	let total = $derived(data.reduce((sum, entry) => sum + entry.Count, 0));
</script>

<div class="calendar-wrap">
	<div class="month-row" style={`grid-template-columns: repeat(${weeks.length}, 1fr)`}>
		{#each monthLabels as month (month.index)}
			<span class="month-label" style={`grid-column: ${month.index + 1}`}>{month.label}</span>
		{/each}
	</div>
	<div class="calendar-body">
		<div class="weekday-labels">
			<span></span>
			<span>Mon</span>
			<span></span>
			<span>Wed</span>
			<span></span>
			<span>Fri</span>
			<span></span>
		</div>
		<div class="grid" style={`grid-template-columns: repeat(${weeks.length}, 1fr)`}>
			{#each weeks as week, index (index)}
				<div class="week-col">
					{#each week as day (day.key)}
						<div
							class="day-cell level-{day.level}"
							title={`${day.count} ${day.count === 1 ? 'entry' : 'entries'} on ${formatDate(day.date)}`}
						></div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
	<div class="legend">
		<span class="muted">{total} contributing {total === 1 ? 'entry' : 'entries'} in the last year</span>
		<div class="legend-scale">
			<span class="muted">Less</span>
			<div class="day-cell level-0"></div>
			<div class="day-cell level-1"></div>
			<div class="day-cell level-2"></div>
			<div class="day-cell level-3"></div>
			<div class="day-cell level-4"></div>
			<span class="muted">More</span>
		</div>
	</div>
</div>

<style>
	.calendar-wrap {
		--heat-0: var(--bg-hover);
		--heat-1: #0e4429;
		--heat-2: #006d32;
		--heat-3: #26a641;
		--heat-4: #39d353;
		overflow-x: auto;
	}
	.month-row {
		display: grid;
		gap: 3px;
		padding-left: 28px;
		margin-bottom: 0.25rem;
		min-width: 640px;
	}
	.month-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.calendar-body {
		display: flex;
		gap: 6px;
		min-width: 640px;
	}
	.weekday-labels {
		display: grid;
		grid-template-rows: repeat(7, 11px);
		gap: 3px;
		flex-shrink: 0;
	}
	.weekday-labels span {
		font-size: 0.65rem;
		color: var(--text-muted);
		line-height: 11px;
	}
	.grid {
		display: grid;
		grid-auto-flow: column;
		gap: 3px;
		flex: 1;
	}
	.week-col {
		display: grid;
		grid-template-rows: repeat(7, 11px);
		gap: 3px;
	}
	.day-cell {
		width: 11px;
		height: 11px;
		border-radius: 2px;
		background: var(--heat-0);
	}
	.day-cell.level-1 {
		background: var(--heat-1);
	}
	.day-cell.level-2 {
		background: var(--heat-2);
	}
	.day-cell.level-3 {
		background: var(--heat-3);
	}
	.day-cell.level-4 {
		background: var(--heat-4);
	}
	.legend {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.legend-scale {
		display: flex;
		align-items: center;
		gap: 3px;
	}
</style>
