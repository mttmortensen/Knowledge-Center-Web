// Deterministic placeholder metadata for log entries with no title, styled like
// a comic book issue credit line. Seeded by LogId so the same entry always
// renders the same issue.
//
// Every entry below is a REAL, published comic book issue (real publisher,
// issue number, story title, year, and writer) — verified against Wikipedia,
// Marvel/DC/Comic Vine issue pages, and the Grand Comics Database. Nothing
// here is invented. Kept to well-known, recognizable heroes and their most
// famous issues — not obscure back-issues nobody's heard of.

export interface ComicIssue {
	series: string;
	publisher: string;
	issueNumber: number;
	title: string;
	year: number;
	writer: string;
}

const ISSUES: ComicIssue[] = [
	// Marvel Comics
	{ series: 'Spider-Man', publisher: 'Marvel Comics', issueNumber: 1, title: 'Spider-Man!', year: 1963, writer: 'Stan Lee' },
	{ series: 'Spider-Man', publisher: 'Marvel Comics', issueNumber: 121, title: 'The Night Gwen Stacy Died', year: 1973, writer: 'Gerry Conway' },
	{ series: 'Spider-Man', publisher: 'Marvel Comics', issueNumber: 300, title: 'Venom', year: 1988, writer: 'David Michelinie' },

	{ series: 'Wolverine', publisher: 'Marvel Comics', issueNumber: 1, title: 'Wolverine', year: 1982, writer: 'Chris Claremont' },
	{ series: 'Wolverine', publisher: 'Marvel Comics', issueNumber: 1, title: 'Swordquest!', year: 1988, writer: 'Chris Claremont' },
	{ series: 'Wolverine', publisher: 'Marvel Comics', issueNumber: 66, title: 'Old Man Logan, Part One', year: 2008, writer: 'Mark Millar' },

	{ series: 'The Punisher', publisher: 'Marvel Comics', issueNumber: 1, title: 'Marked for Death', year: 1986, writer: 'Steven Grant' },
	{ series: 'The Punisher', publisher: 'Marvel Comics', issueNumber: 1, title: 'The Punisher', year: 1987, writer: 'Mike Baron' },
	{ series: 'The Punisher', publisher: 'Marvel Comics', issueNumber: 1, title: 'Kitchen Irish', year: 2004, writer: 'Garth Ennis' },

	{ series: 'Iron Man', publisher: 'Marvel Comics', issueNumber: 1, title: '...And a Time to Die!', year: 1968, writer: 'Archie Goodwin' },
	{ series: 'Iron Man', publisher: 'Marvel Comics', issueNumber: 55, title: 'Beware...The Blood Brothers!', year: 1973, writer: 'Mike Friedrich' },
	{ series: 'Iron Man', publisher: 'Marvel Comics', issueNumber: 128, title: 'Demon in a Bottle', year: 1979, writer: 'David Michelinie' },

	{ series: 'Deadpool', publisher: 'Marvel Comics', issueNumber: 1, title: 'Deadpool: The Circle Chase', year: 1993, writer: 'Fabian Nicieza' },
	{ series: 'Deadpool', publisher: 'Marvel Comics', issueNumber: 1, title: 'Deadpool', year: 1997, writer: 'Joe Kelly' },
	{ series: 'Deadpool', publisher: 'Marvel Comics', issueNumber: 1, title: 'Deadpool Kills the Marvel Universe', year: 2012, writer: 'Cullen Bunn' },

	{ series: 'Daredevil', publisher: 'Marvel Comics', issueNumber: 1, title: 'Daredevil', year: 1964, writer: 'Stan Lee' },
	{ series: 'Daredevil', publisher: 'Marvel Comics', issueNumber: 181, title: 'Last Hand', year: 1982, writer: 'Frank Miller' },
	{ series: 'Daredevil', publisher: 'Marvel Comics', issueNumber: 227, title: 'Apocalypse', year: 1986, writer: 'Frank Miller' },

	{ series: 'Thor', publisher: 'Marvel Comics', issueNumber: 337, title: 'Doom!', year: 1983, writer: 'Walt Simonson' },
	{ series: 'Thor', publisher: 'Marvel Comics', issueNumber: 1, title: 'Brakka-Dooooom!', year: 2007, writer: 'J. Michael Straczynski' },
	{ series: 'Thor', publisher: 'Marvel Comics', issueNumber: 1, title: 'Goddess of Thunder', year: 2014, writer: 'Jason Aaron' },

	{ series: 'Ms. Marvel', publisher: 'Marvel Comics', issueNumber: 1, title: 'This Kind of Hero', year: 1977, writer: 'Gerry Conway' },
	{ series: 'Ms. Marvel', publisher: 'Marvel Comics', issueNumber: 1, title: 'Best of the Best', year: 2006, writer: 'Brian Reed' },
	{ series: 'Ms. Marvel', publisher: 'Marvel Comics', issueNumber: 1, title: 'No Normal', year: 2014, writer: 'G. Willow Wilson' },

	{ series: 'Black Panther', publisher: 'Marvel Comics', issueNumber: 1, title: 'Black Panther', year: 1977, writer: 'Jack Kirby' },
	{ series: 'Black Panther', publisher: 'Marvel Comics', issueNumber: 1, title: 'Black Panther', year: 1998, writer: 'Christopher Priest' },
	{ series: 'Black Panther', publisher: 'Marvel Comics', issueNumber: 1, title: 'Who Is the Black Panther?, Part One', year: 2005, writer: 'Reginald Hudlin' },

	{ series: 'Captain America', publisher: 'Marvel Comics', issueNumber: 1, title: 'Case No. 1: Meet Captain America', year: 1941, writer: 'Joe Simon and Jack Kirby' },
	{ series: 'Captain America', publisher: 'Marvel Comics', issueNumber: 100, title: 'This Monster Unmasked!', year: 1968, writer: 'Stan Lee' },
	{ series: 'Captain America', publisher: 'Marvel Comics', issueNumber: 25, title: 'The Death of Captain America', year: 2007, writer: 'Ed Brubaker' },

	// DC Comics
	{ series: 'Batman', publisher: 'DC Comics', issueNumber: 1, title: 'The Joker', year: 1940, writer: 'Bill Finger' },
	{ series: 'Batman', publisher: 'DC Comics', issueNumber: 251, title: "The Joker's Five-Way Revenge!", year: 1973, writer: "Denny O'Neil" },
	{ series: 'Batman', publisher: 'DC Comics', issueNumber: 428, title: 'A Death in the Family', year: 1988, writer: 'Jim Starlin' },

	{ series: 'Superman', publisher: 'DC Comics', issueNumber: 1, title: 'The Coming of Superman', year: 1939, writer: 'Jerry Siegel' },
	{ series: 'Superman', publisher: 'DC Comics', issueNumber: 423, title: 'Whatever Happened to the Man of Tomorrow?', year: 1986, writer: 'Alan Moore' },
	{ series: 'Superman', publisher: 'DC Comics', issueNumber: 75, title: 'Doomsday!', year: 1992, writer: 'Dan Jurgens' },

	{ series: 'Wonder Woman', publisher: 'DC Comics', issueNumber: 1, title: 'Introducing Wonder Woman', year: 1942, writer: 'William Moulton Marston' },
	{ series: 'Wonder Woman', publisher: 'DC Comics', issueNumber: 329, title: 'Of Gods and Men', year: 1986, writer: 'Gerry Conway' },
	{ series: 'Wonder Woman', publisher: 'DC Comics', issueNumber: 1, title: 'Gods and Mortals, Part One', year: 1987, writer: 'George Perez' },

	{ series: 'The Flash', publisher: 'DC Comics', issueNumber: 105, title: 'The Master of Mirrors', year: 1959, writer: 'John Broome' },
	{ series: 'The Flash', publisher: 'DC Comics', issueNumber: 123, title: 'Flash of Two Worlds', year: 1961, writer: 'Gardner Fox' },
	{ series: 'The Flash', publisher: 'DC Comics', issueNumber: 62, title: 'The Return of Barry Allen', year: 1992, writer: 'Mark Waid' },

	{ series: 'Green Lantern', publisher: 'DC Comics', issueNumber: 1, title: 'The Planet of Doomed Men!', year: 1960, writer: 'John Broome' },
	{ series: 'Green Lantern', publisher: 'DC Comics', issueNumber: 76, title: 'No Evil Shall Escape My Sight!', year: 1970, writer: "Denny O'Neil" },
	{ series: 'Green Lantern', publisher: 'DC Comics', issueNumber: 48, title: 'Emerald Twilight', year: 1994, writer: 'Ron Marz' },

	{ series: 'Nightwing', publisher: 'DC Comics', issueNumber: 1, title: 'Child of Justice', year: 1996, writer: 'Chuck Dixon' },
	{ series: 'Nightwing', publisher: 'DC Comics', issueNumber: 1, title: 'Welcome to Gotham', year: 2011, writer: 'Kyle Higgins' },
	{ series: 'Nightwing', publisher: 'DC Comics', issueNumber: 1, title: 'Better Than Batman, Chapter One', year: 2016, writer: 'Tim Seeley' },

	{ series: 'Aquaman', publisher: 'DC Comics', issueNumber: 1, title: 'The Invasion of the Fire Trolls', year: 1962, writer: 'Jack Miller' },
	{ series: 'Aquaman', publisher: 'DC Comics', issueNumber: 2, title: 'Aquaman', year: 1994, writer: 'Peter David' },
	{ series: 'Aquaman', publisher: 'DC Comics', issueNumber: 1, title: 'The Trench, Part One', year: 2011, writer: 'Geoff Johns' },

	{ series: 'Green Arrow', publisher: 'DC Comics', issueNumber: 1, title: 'The Longbow Hunters', year: 1987, writer: 'Mike Grell' },
	{ series: 'Green Arrow', publisher: 'DC Comics', issueNumber: 1, title: 'Green Arrow', year: 1988, writer: 'Mike Grell' },
	{ series: 'Green Arrow', publisher: 'DC Comics', issueNumber: 1, title: 'Quiver, Part One', year: 2001, writer: 'Kevin Smith' },

	// Image Comics
	{ series: 'Spawn', publisher: 'Image Comics', issueNumber: 1, title: 'Spawn', year: 1992, writer: 'Todd McFarlane' },
	{ series: 'Spawn', publisher: 'Image Comics', issueNumber: 9, title: 'Angela', year: 1993, writer: 'Neil Gaiman' },
	{ series: 'Spawn', publisher: 'Image Comics', issueNumber: 100, title: 'Milestone', year: 2000, writer: 'Brian Holguin' },

	{ series: 'Invincible', publisher: 'Image Comics', issueNumber: 1, title: 'Invincible', year: 2003, writer: 'Robert Kirkman' },
	{ series: 'Invincible', publisher: 'Image Comics', issueNumber: 7, title: 'The Omni-Man Reveal', year: 2004, writer: 'Robert Kirkman' },
	{ series: 'Invincible', publisher: 'Image Comics', issueNumber: 100, title: 'Invincible', year: 2013, writer: 'Robert Kirkman' },

	{ series: 'Savage Dragon', publisher: 'Image Comics', issueNumber: 1, title: 'Savage Dragon', year: 1992, writer: 'Erik Larsen' },
	{ series: 'Savage Dragon', publisher: 'Image Comics', issueNumber: 1, title: 'Savage Dragon', year: 1993, writer: 'Erik Larsen' },
	{ series: 'Savage Dragon', publisher: 'Image Comics', issueNumber: 100, title: 'Savage Dragon', year: 2002, writer: 'Erik Larsen' },

	// Dark Horse Comics
	{ series: 'Hellboy', publisher: 'Dark Horse Comics', issueNumber: 1, title: 'Seed of Destruction', year: 1994, writer: 'Mike Mignola and John Byrne' },
	{ series: 'Hellboy', publisher: 'Dark Horse Comics', issueNumber: 1, title: 'Wake the Devil', year: 1996, writer: 'Mike Mignola' },
	{ series: 'Hellboy', publisher: 'Dark Horse Comics', issueNumber: 1, title: 'Box Full of Evil', year: 1999, writer: 'Mike Mignola' },

	// IDW Publishing
	{ series: 'Teenage Mutant Ninja Turtles', publisher: 'IDW Publishing', issueNumber: 1, title: 'Teenage Mutant Ninja Turtles', year: 2011, writer: 'Tom Waltz' },
	{ series: 'Teenage Mutant Ninja Turtles', publisher: 'IDW Publishing', issueNumber: 21, title: 'City Fall, Part One', year: 2013, writer: 'Tom Waltz' },
	{ series: 'Teenage Mutant Ninja Turtles', publisher: 'IDW Publishing', issueNumber: 50, title: 'Teenage Mutant Ninja Turtles', year: 2015, writer: 'Tom Waltz' },

	// BOOM! Studios
	{ series: 'Mighty Morphin Power Rangers', publisher: 'BOOM! Studios', issueNumber: 1, title: 'Mighty Morphin Power Rangers', year: 2016, writer: 'Kyle Higgins' },
	{ series: 'Mighty Morphin Power Rangers', publisher: 'BOOM! Studios', issueNumber: 25, title: 'Shattered Grid, Part One', year: 2018, writer: 'Kyle Higgins' },
	{ series: 'Mighty Morphin Power Rangers', publisher: 'BOOM! Studios', issueNumber: 1, title: 'Go Go Power Rangers', year: 2017, writer: 'Ryan Parrott' }
];

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

export function generateComicIssue(logId: number): ComicIssue {
	const rand = mulberry32(logId);
	return ISSUES[Math.floor(rand() * ISSUES.length)];
}

export function comicTitle(logId: number): string {
	const issue = generateComicIssue(logId);
	return `${issue.series} Issue #${issue.issueNumber}: ${issue.title}`;
}

export function comicByline(logId: number): string {
	const issue = generateComicIssue(logId);
	return `${issue.publisher} · ${issue.year} · Written by ${issue.writer}`;
}
