let open = $state(false);

export const palette = {
	get open() {
		return open;
	},
	show() {
		open = true;
	},
	hide() {
		open = false;
	},
	toggle() {
		open = !open;
	}
};
