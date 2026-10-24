import { auth } from '$lib/stores/auth.svelte';
import { API_BASE_URL } from './config';
import type { ApiErrorBody } from '$lib/types/api';

export class ApiError extends Error {
	status: number;
	/** The parsed JSON error body, when there was one (e.g. a Seasons overload warning). */
	body: unknown;
	constructor(status: number, message: string, body?: unknown) {
		super(message);
		this.status = status;
		this.body = body;
	}
}

export class DemoForbiddenError extends ApiError {
	constructor(message = 'This action is disabled in demo mode.') {
		super(403, message);
	}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(init.headers as Record<string, string>)
	};

	if (auth.token) {
		headers['Authorization'] = `Bearer ${auth.token}`;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

	if (response.status === 401) {
		auth.clearSession();
		throw new ApiError(401, 'Session expired. Please log in again.');
	}

	if (response.status === 403) {
		throw new DemoForbiddenError();
	}

	if (!response.ok) {
		let message = `Request failed (${response.status})`;
		let body: ApiErrorBody | undefined;
		try {
			body = await response.json();
			if (body?.message) message = body.message;
		} catch {
			// body wasn't JSON — keep the generic message
		}
		throw new ApiError(response.status, message, body);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

export const api = {
	get: <T>(path: string) => request<T>(path, { method: 'GET' }),
	post: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
	put: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
	delete: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: 'DELETE', body: body !== undefined ? JSON.stringify(body) : undefined })
};
