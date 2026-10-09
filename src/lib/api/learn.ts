import { auth } from '$lib/stores/auth.svelte';
import { api, ApiError } from './client';
import { API_BASE_URL } from './config';
import type {
	LearnEntry,
	LearnEntryCreateInput,
	LearnOpenQuestion,
	LearnSession,
	LearnSessionCreateInput,
	LearnSessionDetails,
	LearnSessionUpdateInput
} from '$lib/types/api';

export const learnApi = {
	getSessions: () => api.get<LearnSession[]>('/learn/sessions'),
	getSession: (id: number) => api.get<LearnSessionDetails>(`/learn/sessions/${id}`),
	createSession: (input: LearnSessionCreateInput) =>
		api.post<LearnSessionDetails>('/learn/sessions', input),
	updateSession: (id: number, input: LearnSessionUpdateInput) =>
		api.put<LearnSessionDetails>(`/learn/sessions/${id}`, input),
	deleteSession: (id: number) => api.delete<void>(`/learn/sessions/${id}`),

	createEntry: (sessionId: number, input: LearnEntryCreateInput) =>
		api.post<LearnEntry>(`/learn/sessions/${sessionId}/entries`, input),
	updateEntry: (id: number, source: string) =>
		api.put<LearnEntry>(`/learn/entries/${id}`, { Source: source }),
	deleteEntry: (id: number) => api.delete<void>(`/learn/entries/${id}`),

	getOpenQuestions: (sessionId?: number) =>
		api.get<LearnOpenQuestion[]>(
			sessionId ? `/learn/questions/open?sessionId=${sessionId}` : '/learn/questions/open'
		),

	/** Downloads the session as a .md file (the JSON client can't carry a file response). */
	async exportSession(id: number): Promise<void> {
		const headers: Record<string, string> = {};
		if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;

		const response = await fetch(`${API_BASE_URL}/learn/sessions/${id}/export`, { headers });
		if (!response.ok) throw new ApiError(response.status, 'Export failed.');

		const disposition = response.headers.get('Content-Disposition') ?? '';
		const fileName = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `learn-session-${id}.md`;

		const url = URL.createObjectURL(await response.blob());
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	}
};
