import type { SeasonStats } from '$lib/types/api';

// Ending a season asks three short questions. The answers are saved together
// as the season's single Reflection, in Markdown, so the API needs no change.

export const INTENTION_QUESTION = 'Did you do what you set out to do?';
export const CARRY_QUESTION = 'What do you want to bring into the next season?';
const FALLBACK_STALL_QUESTION = 'What got in the way this season?';

/** Names the Focus domain that got the least work, from the season's stats. */
export function stallQuestion(stats: SeasonStats | null): string {
	const focus = (stats?.ByDomain ?? []).filter((d) => d.Role === 'Focus');
	if (focus.length === 0) return FALLBACK_STALL_QUESTION;

	const least = focus.reduce((low, d) => (d.Score < low.Score ? d : low));
	return least.Score === 0
		? `${least.DomainName} didn't get any work this season. What got in the way?`
		: `${least.DomainName} got the least work of your Focus domains. What got in the way?`;
}

/** Each answered question in bold with its answer below; unanswered ones are left out. */
export function composeReflection(answers: { question: string; answer: string }[]): string {
	return answers
		.filter((a) => a.answer.trim())
		.map((a) => `**${a.question}**\n${a.answer.trim()}`)
		.join('\n\n');
}
