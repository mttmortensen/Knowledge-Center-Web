<script lang="ts">
	import type { SeasonStats } from '$lib/types/api';
	import { barSegments, outsideTopNode, roleShares } from '$lib/seasons/stats';
	import RolePill from './RolePill.svelte';

	// A season's activity: totals, where the work went by role, and the
	// most-worked nodes. Shared by the active season page and ended reports.
	let { stats, daysElapsed }: { stats: SeasonStats; daysElapsed: number } = $props();

	const shares = $derived(roleShares(stats));
	const maxScore = $derived(Math.max(0, ...stats.ByDomain.map((d) => d.Score)));
	const drift = $derived(outsideTopNode(stats));

	const roleHeading: Record<string, string> = {
		Focus: 'Focus',
		Passive: 'Passive',
		Outside: 'Outside the season'
	};

	function breakdown(d: SeasonStats['ByDomain'][number]): string {
		const parts = [
			d.Logs && `${d.Logs} ${d.Logs === 1 ? 'log' : 'logs'}`,
			d.ActionsCompleted && `${d.ActionsCompleted} done`,
			d.LearnEntries && `${d.LearnEntries} learn`,
			d.ActionsCreated && `${d.ActionsCreated} created`
		].filter(Boolean);
		return parts.length ? parts.join(' · ') : 'No activity';
	}
</script>

<div class="card kpis">
	<div class="kpi">
		<span class="kpi-value">{stats.FocusShare}%</span>
		<span class="muted">Focus share</span>
	</div>
	<div class="kpi">
		<span class="kpi-value">{stats.ActiveDays}<span class="of"> / {daysElapsed}</span></span>
		<span class="muted">Active days</span>
	</div>
	<div class="kpi">
		<span class="kpi-value">{stats.Totals.Logs}</span>
		<span class="muted">Logs</span>
	</div>
	<div class="kpi">
		<span class="kpi-value"
			>{stats.Totals.ActionsCompleted}<span class="of"> / {stats.Totals.ActionsCreated}</span></span
		>
		<span class="muted">Actions done / created</span>
	</div>
	<div class="kpi">
		<span class="kpi-value">{stats.Totals.LearnEntries}</span>
		<span class="muted"
			>Learn entries · {stats.Totals.LearnSessions}
			{stats.Totals.LearnSessions === 1 ? 'session' : 'sessions'}</span
		>
	</div>
</div>

{#if drift}
	<div class="callout">
		<strong>Drift</strong>
		<span
			>Your most-worked node, <a href="/nodes/{drift.NodeId}">{drift.Title}</a>, is in {drift.DomainName},
			which isn't in this season.</span
		>
	</div>
{/if}

<div class="stats-grid">
	<div class="card stack">
		<h3>Where the work went</h3>
		<div class="share" aria-label="Share of work by role">
			<span class="focus" style:width="{shares.focus}%"></span>
			<span class="passive" style:width="{shares.passive}%"></span>
			<span class="outside" style:width="{shares.outside}%"></span>
		</div>
		<div class="legend">
			<span><i class="sw focus"></i>Focus <b>{shares.focus}%</b></span>
			<span><i class="sw passive"></i>Passive <b>{shares.passive.toFixed(1)}%</b></span>
			{#if shares.outside > 0}
				<span><i class="sw outside"></i>Outside <b>{shares.outside.toFixed(1)}%</b></span>
			{/if}
		</div>

		<div class="bars">
			{#each stats.ByDomain as d, i (d.DomainId)}
				{#if i === 0 || stats.ByDomain[i - 1].Role !== d.Role}
					<div class="role-divider">{roleHeading[d.Role]}</div>
				{/if}
				{@const seg = barSegments(d, maxScore)}
				<div class="bar-row" class:is-outside={d.Role === 'Outside'}>
					<div class="bar-name">
						<a href="/domains/{d.DomainId}">{d.DomainName}</a>
						<small>{breakdown(d)}</small>
					</div>
					<div class="bar-track">
						{#if d.Score === 0}
							<span class="zero"
								>{d.Role === 'Focus' ? `Nothing yet in ${daysElapsed} days` : 'No activity'}</span
							>
						{:else}
							<span class="seg logs" style:width="{seg.logs}%"></span>
							<span class="seg done" style:width="{seg.done}%"></span>
							<span class="seg learn" style:width="{seg.learn}%"></span>
						{/if}
					</div>
					<span class="bar-score">{d.Score}</span>
				</div>
			{/each}
		</div>
		<div class="legend">
			<span><i class="sw logs"></i>Logs</span>
			<span><i class="sw done"></i>Actions done</span>
			<span><i class="sw learn"></i>Learn entries</span>
		</div>
	</div>

	<div class="card stack">
		<h3>Top Knowledge Nodes</h3>
		{#if stats.TopKnowledgeNodes.length === 0}
			<p class="muted">No scored work yet.</p>
		{:else}
			<div class="scroll-x">
				<table class="nodes">
					<thead>
						<tr>
							<th>Node</th>
							<th>Role</th>
							<th class="n">Logs</th>
							<th class="n">Done</th>
							<th class="n">Learn</th>
							<th class="n">Score</th>
						</tr>
					</thead>
					<tbody>
						{#each stats.TopKnowledgeNodes as n (n.NodeId)}
							<tr>
								<td><a href="/nodes/{n.NodeId}">{n.Title}</a></td>
								<td><RolePill role={n.Role} /></td>
								<td class="n">{n.Logs}</td>
								<td class="n">{n.ActionsCompleted}</td>
								<td class="n">{n.LearnEntries}</td>
								<td class="n"><b>{n.Score}</b></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		{#if stats.UnfiledLearnEntries > 0}
			<p class="muted">
				{stats.UnfiledLearnEntries} Learn {stats.UnfiledLearnEntries === 1 ? 'entry isn’t' : 'entries aren’t'} filed
				under a node, so they aren't scored.
			</p>
		{/if}
	</div>
</div>

<style>
	h3 {
		margin: 0;
		font-size: 1rem;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		margin-bottom: 0;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.kpi {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.kpi-value {
		font-size: 1.5rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.of {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-weight: 400;
	}
	.callout {
		margin-bottom: 1rem;
	}
	.stats-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.share {
		display: flex;
		height: 1.1rem;
		border-radius: 4px;
		overflow: hidden;
		background: var(--bg-hover);
	}
	.share span {
		display: block;
		height: 100%;
	}
	.focus {
		background: var(--season-focus);
	}
	.passive {
		background: var(--season-passive);
	}
	.outside {
		background: repeating-linear-gradient(135deg, var(--season-outside) 0 4px, transparent 4px 8px);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	.legend b {
		color: var(--text);
		font-weight: 600;
	}
	.sw {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		margin-right: 0.3rem;
		vertical-align: -1px;
	}

	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.role-divider {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		border-top: 1px solid var(--border);
		padding-top: 0.45rem;
	}
	.bar-row {
		display: grid;
		grid-template-columns: minmax(0, 12rem) minmax(0, 1fr) 2rem;
		gap: 0.75rem;
		align-items: center;
		font-size: 0.88rem;
	}
	.bar-name {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.bar-name a {
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bar-name small {
		font-size: 0.72rem;
		color: var(--text-muted);
	}
	.bar-track {
		display: flex;
		height: 0.9rem;
		border-radius: 3px;
		overflow: hidden;
	}
	.bar-row.is-outside .seg {
		opacity: 0.45;
	}
	.seg.logs,
	.sw.logs {
		background: var(--accent);
	}
	.seg.done,
	.sw.done {
		background: var(--success);
	}
	.seg.learn,
	.sw.learn {
		background: var(--warning);
	}
	.zero {
		font-size: 0.75rem;
		color: var(--warning);
		white-space: nowrap;
		line-height: 0.9rem;
	}
	.bar-score {
		text-align: right;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.scroll-x {
		overflow-x: auto;
	}
	.nodes {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
		font-variant-numeric: tabular-nums;
	}
	.nodes th {
		text-align: left;
		font-weight: 600;
		color: var(--text-muted);
		font-size: 0.78rem;
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid var(--border);
	}
	.nodes td {
		padding: 0.45rem 0.5rem;
		border-bottom: 1px solid var(--border);
	}
	.nodes .n {
		text-align: right;
	}

	@media (max-width: 760px) {
		.kpis {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.stats-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.bar-row {
			grid-template-columns: minmax(0, 8rem) minmax(0, 1fr) 2rem;
		}
	}
</style>
