// Phone photos come off the camera at 3–12 MB and 4000+ px on a side — far more
// than a log entry needs, and slow to push over a phone connection. Before
// upload, anything big gets scaled down and re-encoded as JPEG in the browser.

/** Longest side, in pixels, an uploaded image is scaled down to. */
export const MAX_DIMENSION = 2560;

/** Files at or under this size are uploaded untouched (if the API accepts their type). */
export const RESIZE_THRESHOLD_BYTES = 1.5 * 1024 * 1024;

/** The API's own per-image cap (ImageService.MaxFileSizeBytes). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const JPEG_QUALITY = 0.85;

const API_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

/** Scales (width, height) down so neither side exceeds `max`, keeping the aspect ratio. Never scales up. */
export function scaleToFit(width: number, height: number, max = MAX_DIMENSION) {
	const scale = Math.min(1, max / Math.max(width, height));
	return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Whether a file should be re-encoded before upload: anything over the size
 * threshold, plus types the API won't take (e.g. HEIC from an iPhone). GIFs are
 * left alone so animations survive.
 */
export function needsResize(file: Pick<File, 'type' | 'size'>): boolean {
	if (file.type === 'image/gif') return false;
	return file.size > RESIZE_THRESHOLD_BYTES || !API_TYPES.has(file.type);
}

export function formatMegabytes(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns a smaller JPEG version of `file`, or `file` itself when it doesn't
 * need shrinking or the browser can't decode it (the API then gets the
 * original and says what's wrong with it).
 */
export async function shrinkImage(file: File): Promise<File> {
	if (!needsResize(file)) return file;

	let bitmap: ImageBitmap;
	try {
		// from-image applies the photo's EXIF rotation, so portrait shots stay upright.
		bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch {
		return file;
	}

	try {
		const { width, height } = scaleToFit(bitmap.width, bitmap.height);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return file;

		// JPEG has no alpha; paint white first so transparent PNGs don't turn black.
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, width, height);
		ctx.drawImage(bitmap, 0, 0, width, height);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
		);
		if (!blob) return file;

		// A small PNG screenshot can come out bigger as JPEG; keep whichever is smaller,
		// as long as the original is a type the API takes.
		if (blob.size >= file.size && API_TYPES.has(file.type)) return file;

		const name = file.name.replace(/\.[^.]*$/, '') + '.jpg';
		return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
	} finally {
		bitmap.close();
	}
}
