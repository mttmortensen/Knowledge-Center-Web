// Shared column-sorting helpers for the listing tables. Each table component
// owns its own sort state, so a page that renders one table per group sorts
// each group independently.

export type SortDirection = 'asc' | 'desc';

export type SortState = { key: string; dir: SortDirection };

/** What a column sorts on: dates and counts as numbers, everything else as text. */
export type SortValue = string | number;

export type SortColumn = {
	key: string;
	label: string;
	/** Direction applied the first time this column is picked. Defaults to 'asc'. */
	dir?: SortDirection;
};

function compare(a: SortValue, b: SortValue): number {
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function sortRows<T>(
	rows: T[],
	sort: SortState,
	valueOf: (row: T, key: string) => SortValue
): T[] {
	const sign = sort.dir === 'asc' ? 1 : -1;
	// Array.prototype.sort is stable, so ties keep the order the caller supplied.
	// That also makes re-sorting an already-sorted page slice a no-op, which is
	// what lets a paginated page sort the full list and still hand the table a slice.
	return [...rows].sort((a, b) => sign * compare(valueOf(a, sort.key), valueOf(b, sort.key)));
}

export function toggleSort(sort: SortState, key: string, dir: SortDirection = 'asc'): SortState {
	if (sort.key !== key) return { key, dir };
	return { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' };
}

export function ariaSort(sort: SortState, key: string): 'ascending' | 'descending' | 'none' {
	if (sort.key !== key) return 'none';
	return sort.dir === 'asc' ? 'ascending' : 'descending';
}
