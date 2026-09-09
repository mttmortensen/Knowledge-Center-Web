// Deterministic placeholder metadata for log entries with no title, styled like
// a comic book issue credit line. Seeded by LogId so the same entry always
// renders the same generated title/series/year/writer.

const SERIES = [
	'Rocket Ranger',
	'The Crimson Comet',
	'Nightshade Vigil',
	'Ironclad Sentinel',
	'The Amazing Voltage',
	'Captain Aegis',
	'The Unstoppable Meridian',
	'Shadowbyte',
	'The Astonishing Halcyon',
	'Quantum Wraith',
	'The Silver Cipher',
	'Blackout Squadron',
	'The Uncanny Lodestar',
	'Timberwolf Six',
	'The Invincible Static'
];

const SUBTITLE_TEMPLATES = [
	"Fun'n Games with the {group}",
	'The {group} Strikes Back',
	'Reckoning at {place}',
	'The Last Stand of the {group}',
	'Trouble in {place}',
	'The {adjective} Gambit',
	'Rise of the {adjective} Order',
	'Betrayal at {place}',
	'The {adjective} Ultimatum',
	'Siege of {place}',
	'The {group} Never Sleeps',
	'A {adjective} Homecoming',
	"The {group}'s Last Stand",
	'Dawn of the {adjective} Age',
	'Escape from {place}'
];

const GROUPS = [
	'Four-Star Squad',
	'Midnight Syndicate',
	'Iron Vanguard',
	'Ghost Battalion',
	'Steel Horizon Corps',
	'Wraith Collective',
	'Thunder Cartel',
	'Obsidian League'
];

const PLACES = [
	'Starlight City',
	'the Hollow Precinct',
	'Ashfall Tower',
	'the Neon Sprawl',
	'Ironmarch',
	'the Sunken District',
	'Graystone Harbor',
	'the Fractured Vault'
];

const ADJECTIVES = [
	'Crimson',
	'Final',
	'Silent',
	'Shattered',
	'Midnight',
	'Radiant',
	'Forgotten',
	'Relentless'
];

const FIRST_NAMES = [
	'J. Miles',
	'Corey',
	'Danielle',
	'Marcus',
	'Priya',
	'Wesley',
	'Ana',
	'Theo'
];

const LAST_NAMES = [
	'Sinclair',
	'Okafor',
	'Vance',
	'Rourke',
	'Delgado',
	'Winters',
	'Marchetti',
	'Blackwood'
];

export interface ComicIssue {
	series: string;
	issueNumber: number;
	subtitle: string;
	year: number;
	writer: string;
}

// mulberry32 - small, fast, seedable PRNG. Good enough for cosmetic flavor text.
function mulberry32(seed: number): () => number {
	let a = seed;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(rand: () => number, items: T[]): T {
	return items[Math.floor(rand() * items.length)];
}

function fillTemplate(rand: () => number, template: string): string {
	return template
		.replace('{group}', () => pick(rand, GROUPS))
		.replace('{place}', () => pick(rand, PLACES))
		.replace('{adjective}', () => pick(rand, ADJECTIVES));
}

export function generateComicIssue(logId: number): ComicIssue {
	const rand = mulberry32(logId);

	return {
		series: pick(rand, SERIES),
		issueNumber: 1 + Math.floor(rand() * 999),
		subtitle: fillTemplate(rand, pick(rand, SUBTITLE_TEMPLATES)),
		year: 1963 + Math.floor(rand() * (2025 - 1963 + 1)),
		writer: `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`
	};
}

export function comicTitle(logId: number): string {
	const issue = generateComicIssue(logId);
	return `${issue.series} Issue #${issue.issueNumber}: ${issue.subtitle}`;
}

export function comicByline(logId: number): string {
	const issue = generateComicIssue(logId);
	return `${issue.series} · ${issue.year} · Written by ${issue.writer}`;
}
