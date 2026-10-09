// Derives a Learn entry's type and links from its raw markdown source, live as
// the user types. The API has the authoritative twin of these rules
// (Services/Core/LearnSourceParser.cs); keep the two in step.
//
//   @answers(12) ...   follow-up to entry 12
//   ?? ...             question
//   ```...             code block
//   ![caption](url)    image (when that is the whole entry)
//   anything else      note
//
// Learn is deliberately separate from Logs: nothing here reads or writes them.

import type { LearnEntryType } from '$lib/types/api';

export interface ParsedSource {
	type: LearnEntryType;
	answersEntryId: number | null;
	/** The markdown to render, with any leading ?? or @answers(n) marker removed. */
	body: string;
}

const ANSWERS = /^\s*@answers\((\d+)\)[ \t]*/;
const IMAGE = /^\s*!\[[^\]]*\]\([^)\s]+\)\s*$/;

export function parseSource(source: string): ParsedSource {
	const answers = ANSWERS.exec(source);
	if (answers) {
		return {
			type: 'followup',
			answersEntryId: Number(answers[1]),
			body: source.slice(answers[0].length)
		};
	}

	const trimmed = source.trimStart();
	if (trimmed.startsWith('??')) {
		return { type: 'question', answersEntryId: null, body: trimmed.slice(2).trimStart() };
	}
	if (trimmed.startsWith('```')) return { type: 'code', answersEntryId: null, body: source };
	if (IMAGE.test(source)) return { type: 'image', answersEntryId: null, body: source };

	return { type: 'note', answersEntryId: null, body: source };
}

export interface EntryLinks {
	parsed: ParsedSource;
	/** For questions: open until any follow-up in the session points at them. */
	questionStatus: 'open' | 'answered' | null;
	/** Follow-ups pointing at this entry, in timeline order. */
	answeredBy: number[];
	/** For follow-ups: false when the @answers target no longer exists. */
	targetExists: boolean;
}

/** Works out every entry's links from the whole session's sources. */
export function linkEntries(entries: { EntryId: number; Source: string }[]): Map<number, EntryLinks> {
	const parsed = new Map(entries.map((e) => [e.EntryId, parseSource(e.Source)]));

	const answeredBy = new Map<number, number[]>();
	for (const e of entries) {
		const target = parsed.get(e.EntryId)!.answersEntryId;
		if (target !== null) answeredBy.set(target, [...(answeredBy.get(target) ?? []), e.EntryId]);
	}

	const links = new Map<number, EntryLinks>();
	for (const e of entries) {
		const p = parsed.get(e.EntryId)!;
		const by = answeredBy.get(e.EntryId) ?? [];
		links.set(e.EntryId, {
			parsed: p,
			questionStatus: p.type === 'question' ? (by.length > 0 ? 'answered' : 'open') : null,
			answeredBy: by,
			targetExists: p.answersEntryId === null || parsed.has(p.answersEntryId)
		});
	}
	return links;
}
