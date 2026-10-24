import { describe, expect, it } from 'vitest';
import type { SeasonDomainStats, SeasonStats } from '$lib/types/api';
import { barSegments, formatDay, idleFocusDomains, outsideTopNode, roleShares } from './stats';
import { expectedOverloadLevel, focusCount, phraseMatches, toEditorLineup, toLineupInput } from './lineup';
import { composeReflection, stallQuestion } from './reflection';

function domain(name: string, role: SeasonDomainStats['Role'], logs: number, done = 0, learn = 0): SeasonDomainStats {
	return {
		DomainId: name.length,
		DomainName: name,
		Role: role,
		Logs: logs,
		ActionsCreated: 0,
		ActionsCompleted: done,
		LearnEntries: learn,
		Score: logs + done + learn
	};
}

function stats(byDomain: SeasonDomainStats[], focusShare: number): SeasonStats {
	return {
		From: '2026-04-16T00:00:00',
		To: '2026-06-15T00:00:00',
		ActiveDays: 0,
		FocusShare: focusShare,
		Totals: { Logs: 0, ActionsCreated: 0, ActionsCompleted: 0, LearnSessions: 0, LearnEntries: 0 },
		ByDomain: byDomain,
		TopKnowledgeNodes: [],
		UnfiledLearnEntries: 0
	};
}

// The demo's ended Spring season: 37 Focus, 13 Passive, 10 Outside.
const spring = stats(
	[
		domain('Distributed Systems', 'Focus', 17, 3),
		domain('Machine Learning', 'Focus', 13, 4),
		domain('Web Security', 'Passive', 11, 2),
		domain('Compilers & Languages', 'Outside', 7, 2),
		domain('Databases', 'Outside', 1)
	],
	61.7
);

describe('stats', () => {
	it('splits the score by role', () => {
		const s = roleShares(spring);
		expect(s.focus).toBe(61.7);
		expect(s.passive).toBeCloseTo(21.67, 1);
		expect(s.outside).toBeCloseTo(16.67, 1);
	});

	it('handles a season with no scored work', () => {
		expect(roleShares(stats([domain('A', 'Focus', 0)], 0))).toEqual({ focus: 0, passive: 0, outside: 0 });
	});

	it('scales bar segments to the busiest domain', () => {
		expect(barSegments(spring.ByDomain[1], 20)).toEqual({ logs: 65, done: 20, learn: 0 });
	});

	it('finds Focus domains with no work', () => {
		const autumn = stats([domain('Databases', 'Focus', 0, 0, 6), domain('Compilers', 'Focus', 0)], 100);
		expect(idleFocusDomains(autumn).map((d) => d.DomainName)).toEqual(['Compilers']);
	});

	it('flags a top node outside the season', () => {
		const withNode = { ...spring, TopKnowledgeNodes: [{ ...spring.ByDomain[3], NodeId: 13, Title: 'Best Practices' }] };
		expect(outsideTopNode(withNode)?.NodeId).toBe(13);
		expect(outsideTopNode(spring)).toBeNull();
	});

	it('formats date-only strings without shifting the day', () => {
		expect(formatDay('2026-12-02')).toBe('Dec 2');
		expect(formatDay('2027-01-31', true)).toBe('Jan 31, 2027');
	});
});

describe('lineup', () => {
	const members = [
		{ DomainId: 5, DomainName: 'Databases', Role: 'Focus' as const, Note: null, IsArchived: false },
		{ DomainId: 3, DomainName: 'Web Security', Role: 'Passive' as const, Note: 'Covered at work', IsArchived: false }
	];

	it('round-trips, leaving resting domains out', () => {
		const lineup = toEditorLineup([1, 3, 5], members);
		expect(lineup[1].role).toBe('Resting');
		expect(toLineupInput(lineup)).toEqual([
			{ DomainId: 3, Role: 'Passive', Note: 'Covered at work' },
			{ DomainId: 5, Role: 'Focus' }
		]);
	});

	it('counts Focus and mirrors the API warning levels', () => {
		expect(focusCount(toEditorLineup([1, 3, 5], members))).toBe(1);
		expect([2, 3, 4, 5, 6, 9].map(expectedOverloadLevel)).toEqual([0, 1, 2, 3, 4, 4]);
	});

	it('matches phrases like the API does', () => {
		const phrase = 'I accept slower progress on everything';
		expect(phraseMatches('  i accept   SLOWER progress on everything. ', phrase)).toBe(true);
		expect(phraseMatches('I accept slow progress on everything', phrase)).toBe(false);
	});
});

describe('reflection', () => {
	it('names the Focus domain with the least work', () => {
		const autumn = stats([domain('Databases', 'Focus', 0, 0, 6), domain('Compilers & Languages', 'Focus', 0)], 100);
		expect(stallQuestion(autumn)).toBe(
			"Compilers & Languages didn't get any work this season. What got in the way?"
		);
		expect(stallQuestion(spring)).toBe(
			'Machine Learning got the least work of your Focus domains. What got in the way?'
		);
		expect(stallQuestion(null)).toBe('What got in the way this season?');
	});

	it('joins answered questions and skips blank ones', () => {
		expect(
			composeReflection([
				{ question: 'Q1?', answer: ' Mostly. ' },
				{ question: 'Q2?', answer: '   ' },
				{ question: 'Q3?', answer: 'The parser.' }
			])
		).toBe('**Q1?**\nMostly.\n\n**Q3?**\nThe parser.');
	});
});
