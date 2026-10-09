// Derives a Learn entry's type and links from its raw markdown source, live as
// the user types. The API has the authoritative twin of these rules
// (Services/Core/LearnSourceParser.cs); keep the two in step.
//
//   @answers(12) ...   follow-up to entry 12
//   @log(34)           reference to log 34 (the reference is the whole entry)
//   @log <markdown>    draft of a new log; becomes @log(<id>) once saved
//   ?? ...             question
//   ```...             code block
//   ![caption](url)    image (when that is the whole entry)
//   anything else      note

import type { LearnEntryType } from '$lib/types/api';

export interface ParsedSource {
	type: LearnEntryType;
	answersEntryId: number | null;
	logId: number | null;
	/** The markdown to render, with any leading ??, @answers(n) marker removed. */
	body: string;
}

const ANSWERS = /^\s*@answers\((\d+)\)[ \t]*/;
const LOG_REF = /^\s*@log\((\d+)\)\s*$/;
const NEW_LOG = /^\s*@log\s+(\S[\s\S]*)$/;
const IMAGE = /^\s*!\[[^\]]*\]\([^)\s]+\)\s*$/;

export function parseSource(source: string): ParsedSource {
	const answers = ANSWERS.exec(source);
	if (answers) {
		return {
			type: 'followup',
			answersEntryId: Number(answers[1]),
			logId: null,
			body: source.slice(answers[0].length)
		};
	}

	const log = LOG_REF.exec(source);
	if (log) return { type: 'log', answersEntryId: null, logId: Number(log[1]), body: '' };

	const trimmed = source.trimStart();
	if (trimmed.startsWith('??')) {
		return { type: 'question', answersEntryId: null, logId: null, body: trimmed.slice(2).trimStart() };
	}
	if (trimmed.startsWith('```')) return { type: 'code', answersEntryId: null, logId: null, body: source };
	if (IMAGE.test(source)) return { type: 'image', answersEntryId: null, logId: null, body: source };

	return { type: 'note', answersEntryId: null, logId: null, body: source };
}

/**
 * "@log <markdown>" written in the sheet: the text for a new log entry. An optional
 * leading "# Heading" line becomes the log's title.
 */
export function parseNewLog(source: string): { title?: string; content: string } | null {
	const match = NEW_LOG.exec(source);
	if (!match) return null;

	const text = match[1].trim();
	const heading = /^#\s+(.+)\n+([\s\S]+)$/.exec(text);
	return heading ? { title: heading[1].trim(), content: heading[2].trim() } : { content: text };
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
