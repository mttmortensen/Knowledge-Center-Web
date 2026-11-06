import type { Season, SeasonDomainStats, SeasonNodeStats, SeasonStats } from '$lib/types/api';
import type { SortValue } from '$lib/utils/tableSort';

/** Percent (0-100) of scored work that went to each role. Focus matches the API's FocusShare. */
export function roleShares(stats: SeasonStats): { focus: number; passive: number; outside: number } {
	const total = stats.ByDomain.reduce((sum, d) => sum + d.Score, 0);
	const share = (role: string) =>
		total === 0
			? 0
			: (100 * stats.ByDomain.filter((d) => d.Role === role).reduce((sum, d) => sum + d.Score, 0)) / total;
	return { focus: stats.FocusShare, passive: share('Passive'), outside: share('Outside') };
}

/** Bar segment widths (percent of the busiest domain's score) for one domain row. */
export function barSegments(domain: SeasonDomainStats, maxScore: number) {
	const pct = (v: number) => (maxScore === 0 ? 0 : (100 * v) / maxScore);
	return {
		logs: pct(domain.Logs),
		done: pct(domain.ActionsCompleted),
		learn: pct(domain.LearnEntries)
	};
}

/** Focus domains with nothing scored: the thing most worth pointing out. */
export function idleFocusDomains(stats: SeasonStats): SeasonDomainStats[] {
	return stats.ByDomain.filter((d) => d.Role === 'Focus' && d.Score === 0);
}

/** The season's most-worked node, when it sits in a domain that wasn't in the season. */
export function outsideTopNode(stats: SeasonStats): SeasonNodeStats | null {
	const top = stats.TopKnowledgeNodes[0];
	return top && top.Role === 'Outside' ? top : null;
}

/** What each column of the season's node table sorts on. Role runs Focus, Passive, Outside. */
export function nodeSortValue(node: SeasonNodeStats, key: string): SortValue {
	switch (key) {
		case 'title':
			return node.Title;
		case 'role':
			return ['Focus', 'Passive', 'Outside'].indexOf(node.Role);
		case 'logs':
			return node.Logs;
		case 'done':
			return node.ActionsCompleted;
		case 'learn':
			return node.LearnEntries;
		default:
			return node.Score;
	}
}

/** Elapsed share of the planned length, 0-100. */
export function progressPercent(season: Season): number {
	if (season.DaysElapsed == null || season.DaysPlanned <= 0) return 0;
	return Math.min(100, (100 * season.DaysElapsed) / season.DaysPlanned);
}

/** "Oct 3" / "Dec 2, 2026" from a date-only "YYYY-MM-DD" string, without a time-zone shift. */
export function formatDay(isoDate: string, withYear = false): string {
	const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
	return new Date(y, m - 1, d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		...(withYear ? { year: 'numeric' } : {})
	});
}

export function formatRange(season: Pick<Season, 'PlannedStart' | 'PlannedEnd'>): string {
	return `${formatDay(season.PlannedStart)} – ${formatDay(season.PlannedEnd, true)}`;
}
