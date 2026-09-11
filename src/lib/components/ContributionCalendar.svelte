<script lang="ts">
	import type { CtpDayCount } from '$lib/types/api';

	let {
		data,
		singular = 'log entry',
		plural = 'log entries'
	}: { data: CtpDayCount[]; singular?: string; plural?: string } = $props();

	const MAX_WEEKS = 105; // ~2 years, a sane ceiling for an unusually wide card
	const CELL_SIZE = 11;
	const CELL_GAP = 3;
	const CELL_PITCH = CELL_SIZE + CELL_GAP;
	const LABEL_COLUMN_WIDTH = 28;
	const LABEL_GRID_GAP = 6;
	const MIN_LABEL_GAP_WEEKS = 2; // minimum columns between month labels so text can't overlap

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

	let containerWidth = $state(0);

	// Rather than letting the grid overflow into a scrollbar, generate exactly as
	// many of the most recent weeks as fit the available width at a fixed cell
	// size — like GitHub's graph showing fewer months on a narrower profile
	// column, but also filling a wider one instead of leaving it blank.
	let weeksToShow = $derived.by(() => {
		const available = containerWidth - LABEL_COLUMN_WIDTH - LABEL_GRID_GAP;
		if (available <= 0) return 1;

		const fit = Math.floor((available + CELL_GAP) / CELL_PITCH);
		return Math.max(1, Math.min(fit, MAX_WEEKS));
	});

	let weeks = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of data) {
			counts.set(entry.Date.slice(0, 10), entry.Count);
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const start = new Date(today);
		start.setDate(start.getDate() - (weeksToShow * 7 - 1));
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

		// Aligning the start date back to the nearest Sunday can add one extra
		// leading week beyond what weeksToShow asked for — trim back down to the
		// exact count so the rendered grid never exceeds the measured width.
		return result.slice(-weeksToShow);
	});

	let monthLabels = $derived.by(() => {
		const labels: { index: number; label: string }[] = [];
		let lastMonth = -1;
		let lastLabelIndex = -Infinity;

		weeks.forEach((week, index) => {
			const firstDay = week[0];
			if (!firstDay) return;

			const month = firstDay.date.getMonth();
			if (month === lastMonth) return;
			lastMonth = month;

			// Skip a label that would land too close to the previous one — e.g. the
			// visible window starting just a week or two into a new month — since
			// there isn't room to render its text without overlapping.
			if (index - lastLabelIndex < MIN_LABEL_GAP_WEEKS) return;

			labels.push({ index, label: firstDay.date.toLocaleString(undefined, { month: 'short' }) });
			lastLabelIndex = index;
		});

		return labels;
	});

	let total = $derived(data.reduce((sum, entry) => sum + entry.Count, 0));
</script>

<div class="calendar-wrap" bind:clientWidth={containerWidth}>
	<div class="month-row" style={`grid-template-columns: repeat(${weeks.length}, ${CELL_SIZE}px)`}>
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
		<div class="grid" style={`grid-template-columns: repeat(${weeks.length}, ${CELL_SIZE}px)`}>
			{#each weeks as week, index (index)}
				<div class="week-col">
					{#each week as day (day.key)}
						<div
							class="day-cell level-{day.level}"
							title={`${day.count} ${day.count === 1 ? singular : plural} on ${formatDate(day.date)}`}
						></div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
	<div class="legend">
		<span class="muted">{total} {total === 1 ? singular : plural} in the last year</span>
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
		/* Without an explicit width, this element's own intrinsic content (the
		   pixel-width week grid) can pull its ancestor grid/flex tracks wider
		   than the space actually available, which then gets measured back in
		   as a bigger clientWidth — a self-reinforcing sizing loop. Pinning to
		   100% ties this strictly to the parent's box instead. */
		width: 100%;
		overflow: hidden;
	}
	.month-row {
		display: grid;
		gap: 3px;
		padding-left: 28px;
		margin-bottom: 0.25rem;
	}
	.month-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.calendar-body {
		display: flex;
		gap: 6px;
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
