import type { SeasonDomain, SeasonDomainInput, SeasonRole } from '$lib/types/api';

// The editor works in three roles; the API stores only Focus and Passive, and
// any domain left out of the lineup is resting.

export type LineupRole = SeasonRole | 'Resting';

export interface LineupEntry {
	role: LineupRole;
	note: string;
}

/** The season's normal Focus capacity. Passive domains never count toward it. */
export const MAX_FOCUS = 2;

export function toEditorLineup(domainIds: number[], members: SeasonDomain[]): Record<number, LineupEntry> {
	const lineup: Record<number, LineupEntry> = {};
	for (const id of domainIds) lineup[id] = { role: 'Resting', note: '' };
	for (const m of members) lineup[m.DomainId] = { role: m.Role, note: m.Note ?? '' };
	return lineup;
}

export function toLineupInput(lineup: Record<number, LineupEntry>): SeasonDomainInput[] {
	return Object.entries(lineup)
		.filter(([, e]) => e.role !== 'Resting')
		.map(([id, e]) => ({
			DomainId: Number(id),
			Role: e.role as SeasonRole,
			...(e.note.trim() ? { Note: e.note.trim() } : {})
		}));
}

export function focusCount(lineup: Record<number, LineupEntry>): number {
	return Object.values(lineup).filter((e) => e.role === 'Focus').length;
}

/**
 * The warning level the API will likely answer with, for labelling Save only.
 * The API decides; this mirrors SeasonOverloadPolicy.LevelFor.
 */
export function expectedOverloadLevel(focus: number): number {
	return focus <= MAX_FOCUS ? 0 : Math.min(focus - MAX_FOCUS, 4);
}

/** Same normalisation the API uses: case, spacing and a trailing full stop don't matter. */
export function phraseMatches(typed: string, phrase: string): boolean {
	const norm = (t: string) => t.trim().replace(/\.$/, '').replace(/\s+/g, ' ').toLowerCase();
	return norm(typed) === norm(phrase);
}
