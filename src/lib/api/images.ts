import { auth } from '$lib/stores/auth.svelte';
import { API_BASE_URL } from './config';
import { ApiError, DemoForbiddenError } from './client';

export async function uploadImage(file: File): Promise<string> {
	const formData = new FormData();
	formData.append('file', file);

	const headers: Record<string, string> = {};
	if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;

	const response = await fetch(`${API_BASE_URL}/images`, {
		method: 'POST',
		headers,
		body: formData
	});

	if (response.status === 403) throw new DemoForbiddenError('Image upload is disabled in demo mode.');
	if (!response.ok) throw new ApiError(response.status, 'Image upload failed.');

	const data: { url: string } = await response.json();
	return data.url;
}
