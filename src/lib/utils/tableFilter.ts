// Shared filtering helpers for the listing pages. A page owns its own filter
// state; these turn that state into predicates and into the option lists the
// FilterBar's dropdowns render.

export type FilterOption = { value: string; label: string };

export type FilterSelect = {
	key: string;
	label: string;
	options: FilterOption[];
	/** Label for the "no choice made" option. Defaults to "All <label>". */
	allLabel?: string;
};

/** The value a select carries when nothing is chosen. */
export const ANY = '';

/**
	* True when every whitespace-separated term in `query` appears somewhere in
	* `fields`. Blank queries match everything, so a page can hand this its search
	* box unconditionally.
	*/
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return true;
	const haystack = fields.filter(Boolean).join(' ').toLowerCase();
	return terms.every((term) => haystack.includes(term));
}

/** True when the select is unset, or the row's value matches it. */
export function matchesSelect(selected: string, value: string | number | null | undefined): boolean {
	return selected === ANY || String(value ?? '') === selected;
}

/** Distinct values of a field across the rows, sorted for a dropdown. */
export function optionsFrom<T>(rows: T[], valueOf: (row: T) => string | null | undefined): FilterOption[] {
	const seen = new Set<string>();
	for (const row of rows) {
		const value = valueOf(row);
		if (value) seen.add(value);
	}
	return [...seen]
		.sort((a, b) => a.localeCompare(b))
		.map((value) => ({ value, label: value }));
}
