import { API_BASE_URL } from './config';
import { auth } from '$lib/stores/auth.svelte';
import type { DemoLoginResponse, LoginResponse } from '$lib/types/api';

export async function login(username: string, password: string): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ Username: username, Password: password })
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body?.message ?? 'Invalid credentials.');
	}

	const data: LoginResponse = await response.json();
	auth.setSession(data.token, false);
}

export async function loginDemo(): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/auth/demo`, { method: 'POST' });

	if (!response.ok) {
		throw new Error('Failed to start demo mode.');
	}

	const data: DemoLoginResponse = await response.json();
	auth.setSession(data.token, true);
}

export async function logout(): Promise<void> {
	const token = auth.token;
	auth.clearSession();

	if (!token) return;

	try {
		await fetch(`${API_BASE_URL}/auth/logout`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});
	} catch {
		// best-effort — the client-side session is already cleared
	}
}
