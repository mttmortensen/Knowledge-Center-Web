import { describe, expect, it } from 'vitest';
import { linkEntries, parseSource } from './parse';
import { renderMarkdown } from './render';

describe('parseSource', () => {
	it.each([
		['Plain note with **bold**', 'note'],
		['?? Why is the sky blue?', 'question'],
		['  ?? leading whitespace still counts', 'question'],
		['? one mark is not a question', 'note'],
		['text then ?? later', 'note'],
		['```sql\nSELECT 1;\n```', 'code'],
		['![diagram](https://x/uploads/a.png)', 'image'],
		['![diagram](https://x/uploads/a.png)\nwith text', 'note'],
		['@answers(12) because', 'followup'],
		['@answers(abc) nope', 'note'],
		['@log(34)', 'note']
	])('%j is a %s', (source, type) => {
		expect(parseSource(source).type).toBe(type);
	});

	it('strips the ?? marker from a question body', () => {
		expect(parseSource('?? What is *MVCC*?').body).toBe('What is *MVCC*?');
	});

	it('links a follow-up to its target and strips the marker', () => {
		const parsed = parseSource('@answers(42) Multi-version concurrency control.');
		expect(parsed.answersEntryId).toBe(42);
		expect(parsed.body).toBe('Multi-version concurrency control.');
	});
});

describe('linkEntries', () => {
	const entries = [
		{ EntryId: 1, Source: '?? first' },
		{ EntryId: 2, Source: '?? second' },
		{ EntryId: 3, Source: 'note' },
		{ EntryId: 4, Source: '@answers(1) yes' },
		{ EntryId: 5, Source: '@answers(1) and also' },
		{ EntryId: 6, Source: '@answers(99) target gone' }
	];
	const links = linkEntries(entries);

	it('marks a question answered once a follow-up points at it', () => {
		expect(links.get(1)!.questionStatus).toBe('answered');
		expect(links.get(1)!.answeredBy).toEqual([4, 5]);
	});

	it('leaves unanswered questions open', () => {
		expect(links.get(2)!.questionStatus).toBe('open');
		expect(links.get(2)!.answeredBy).toEqual([]);
	});

	it('gives non-questions no status', () => {
		expect(links.get(3)!.questionStatus).toBeNull();
		expect(links.get(4)!.questionStatus).toBeNull();
	});

	it('flags follow-ups whose target was deleted', () => {
		expect(links.get(4)!.targetExists).toBe(true);
		expect(links.get(6)!.targetExists).toBe(false);
	});

	it('reopens a question when its only follow-up changes target', () => {
		const relinked = linkEntries([
			{ EntryId: 1, Source: '?? q' },
			{ EntryId: 2, Source: '@answers(3) moved' },
			{ EntryId: 3, Source: 'note' }
		]);
		expect(relinked.get(1)!.questionStatus).toBe('open');
	});
});

describe('renderMarkdown', () => {
	it('escapes raw HTML', () => {
		expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
	});

	it('renders an image caption from its alt text', () => {
		const html = renderMarkdown('![The query plan](https://x/uploads/plan.png)');
		expect(html).toContain('<img src="https://x/uploads/plan.png"');
		expect(html).toContain('<span class="learn-caption">The query plan</span>');
	});
});
