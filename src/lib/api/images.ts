import { auth } from '$lib/stores/auth.svelte';
import { API_BASE_URL } from './config';
import { ApiError, DemoForbiddenError } from './client';
import { MAX_UPLOAD_BYTES, formatMegabytes, shrinkImage } from '$lib/images/resize';

export async function uploadImage(original: File): Promise<string> {
	const file = await shrinkImage(original);

	// Catch this here: a too-large body is rejected by the proxy without CORS
	// headers, which the browser only reports as a bare "Failed to fetch".
	if (file.size > MAX_UPLOAD_BYTES) {
		throw new ApiError(
			413,
			`Image is too large (${formatMegabytes(file.size)}). The limit is ${formatMegabytes(MAX_UPLOAD_BYTES)}.`
		);
	}

	const formData = new FormData();
	formData.append('file', file);

	const headers: Record<string, string> = {};
	if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;

	let response: Response;
	try {
		response = await fetch(`${API_BASE_URL}/images`, {
			method: 'POST',
			headers,
			body: formData
		});
	} catch {
		throw new ApiError(
			0,
			`Couldn't upload the image (${formatMegabytes(file.size)}). The connection dropped or the server rejected it as too large.`
		);
	}

	if (response.status === 403) throw new DemoForbiddenError('Image upload is disabled in demo mode.');
	if (response.status === 413) {
		throw new ApiError(413, `Image is too large for the server (${formatMegabytes(file.size)}).`);
	}
	if (!response.ok) {
		let message = 'Image upload failed.';
		try {
			const body: { message?: string } = await response.json();
			if (body?.message) message = body.message;
		} catch {
			// body wasn't JSON — keep the generic message
		}
		throw new ApiError(response.status, message);
	}

	const data: { url: string } = await response.json();
	return data.url;
}
