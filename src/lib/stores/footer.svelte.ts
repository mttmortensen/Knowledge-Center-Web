export interface FooterHint {
	key: string;
	label: string;
}

const DEFAULT_HINTS: FooterHint[] = [
	{ key: 'ALT+F', label: 'Jump' },
	{ key: 'ALT+1-4', label: 'Workspace' },
	{ key: 'ESC', label: 'Back' }
];

let hints = $state<FooterHint[]>(DEFAULT_HINTS);

export const footer = {
	get hints() {
		return hints;
	},
	set(next: FooterHint[]) {
		hints = next;
	},
	reset() {
		hints = DEFAULT_HINTS;
	}
};
