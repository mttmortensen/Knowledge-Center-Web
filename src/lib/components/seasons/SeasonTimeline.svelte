<script lang="ts">
	import type { Season } from '$lib/types/api';
	import { progressPercent } from '$lib/seasons/stats';

	// Seasons never overlap, so they sit on one time axis: from the first season's
	// month to the month after the last one ends, with today marked.
	let { seasons }: { seasons: Season[] } = $props();

	const day = (iso: string) => {
		const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
		return new Date(y, m - 1, d).getTime();
	};

	const range = $derived.by(() => {
		const starts = seasons.map((s) => day(s.PlannedStart));
		const ends = seasons.map((s) => day(s.PlannedEnd));
		const first = new Date(Math.min(...starts, Date.now()));
		const last = new Date(Math.max(...ends, Date.now()));
		return {
			from: new Date(first.getFullYear(), first.getMonth(), 1).getTime(),
			to: new Date(last.getFullYear(), last.getMonth() + 1, 1).getTime()
		};
	});

	const x = (t: number) => ((t - range.from) / (range.to - range.from)) * 100;

	const months = $derived.by(() => {
		const out: { left: number; label: string }[] = [];
		const d = new Date(range.from);
		while (d.getTime() < range.to) {
			const label = d.toLocaleDateString('en-US', { month: 'short' });
			out.push({ left: x(d.getTime()), label: d.getMonth() === 0 ? `${label} ’${String(d.getFullYear()).slice(2)}` : label });
			d.setMonth(d.getMonth() + 1);
		}
		return out;
	});
</script>

<div class="scroll-x">
	<div class="timeline">
		<div class="months">
			{#each months as m (m.left)}
				<span style:left="{m.left}%">{m.label}</span>
			{/each}
		</div>
		<div class="track">
			{#each months as m (m.left)}
				<span class="tick" style:left="{m.left}%"></span>
			{/each}
			{#each seasons as s (s.SeasonId)}
				{@const left = x(day(s.PlannedStart))}
				<a
					href="/seasons/{s.SeasonId}"
					class="block {s.Status.toLowerCase()}"
					style:left="{left}%"
					style:width="{x(day(s.PlannedEnd)) - left}%"
					title={s.Name}
				>
					{#if s.Status === 'Active'}
						<span class="fill" style:width="{progressPercent(s)}%"></span>
					{/if}
					<span class="label">{s.Name}</span>
				</a>
			{/each}
			<span class="today" style:left="{x(Date.now())}%"></span>
		</div>
	</div>
</div>

<style>
	.scroll-x {
		overflow-x: auto;
		overflow-y: hidden;
		padding-bottom: 0.4rem;
		margin-bottom: 0.6rem;
	}
	.timeline {
		position: relative;
		min-width: 560px;
		padding-top: 1.6rem;
	}
	.months {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1.4rem;
		font-size: 0.7rem;
		color: var(--text-muted);
	}
	.months span {
		position: absolute;
		padding-left: 0.25rem;
	}
	.track {
		position: relative;
		height: 3rem;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}
	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--border);
	}
	.block {
		position: absolute;
		top: 0.4rem;
		height: 2.2rem;
		border-radius: 6px;
		border: 1px solid;
		overflow: hidden;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
	}
	.block:hover {
		text-decoration: none;
		filter: brightness(1.15);
	}
	.block.ended {
		background: var(--bg-hover);
		border-color: var(--border);
		color: var(--text-muted);
	}
	.block.active {
		background: var(--season-focus-soft);
		border-color: var(--accent);
		color: var(--text);
	}
	.block.planned {
		border-style: dashed;
		border-color: var(--text-muted);
		color: var(--text-muted);
	}
	.fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: rgba(110, 168, 254, 0.22);
	}
	.label {
		position: relative;
		padding: 0 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.today {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--warning);
	}
</style>
