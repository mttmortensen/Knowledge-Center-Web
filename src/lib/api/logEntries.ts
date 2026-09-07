import { api } from './client';
import type { LogEntry, LogEntryCreateInput, LogEntryUpdateInput } from '$lib/types/api';

export const logEntriesApi = {
	getAll: (nodeId?: number) => api.get<LogEntry[]>(nodeId ? `/logs?nodeId=${nodeId}` : '/logs'),
	getById: (id: number) => api.get<LogEntry>(`/logs/${id}`),
	create: (input: LogEntryCreateInput) => api.post<LogEntry>('/logs', input),
	update: (id: number, input: LogEntryUpdateInput) => api.put<LogEntry>(`/logs/${id}`, input),
	delete: (id: number) => api.delete<void>(`/logs/${id}`),
	updateChatUrl: (id: number, chatUrl: string) =>
		api.put<void>(`/logs/${id}/chatURL`, { ChatURL: chatUrl }),
	addTags: (id: number, tagIds: number[]) => api.put<void>(`/logs/${id}/tags`, { TagIds: tagIds }),
	removeAllTags: (id: number) => api.delete<void>(`/logs/${id}/tags`),
	removeTags: (id: number, tagIds: number[]) =>
		api.delete<void>(`/logs/${id}/tags/specific`, { TagIds: tagIds })
};
