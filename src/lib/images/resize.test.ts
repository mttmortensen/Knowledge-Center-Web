import { describe, expect, it } from 'vitest';
import { MAX_DIMENSION, RESIZE_THRESHOLD_BYTES, formatMegabytes, needsResize, scaleToFit } from './resize';

describe('scaleToFit', () => {
	it('scales a landscape phone photo so its long side is the max', () => {
		expect(scaleToFit(4032, 3024)).toEqual({ width: MAX_DIMENSION, height: 1920 });
	});

	it('scales a portrait photo by its height', () => {
		expect(scaleToFit(3024, 4032)).toEqual({ width: 1920, height: MAX_DIMENSION });
	});

	it('never scales a small image up', () => {
		expect(scaleToFit(800, 600)).toEqual({ width: 800, height: 600 });
	});
});

describe('needsResize', () => {
	const MB = 1024 * 1024;

	it('resizes a large JPEG', () => {
		expect(needsResize({ type: 'image/jpeg', size: 5 * MB })).toBe(true);
	});

	it('leaves a small JPEG alone', () => {
		expect(needsResize({ type: 'image/jpeg', size: RESIZE_THRESHOLD_BYTES })).toBe(false);
	});

	it('converts HEIC even when small, since the API rejects it', () => {
		expect(needsResize({ type: 'image/heic', size: 500 * 1024 })).toBe(true);
	});

	it('leaves GIFs alone so animations survive', () => {
		expect(needsResize({ type: 'image/gif', size: 8 * MB })).toBe(false);
	});
});

describe('formatMegabytes', () => {
	it('shows one decimal place', () => {
		expect(formatMegabytes(12.34 * 1024 * 1024)).toBe('12.3 MB');
	});
});
