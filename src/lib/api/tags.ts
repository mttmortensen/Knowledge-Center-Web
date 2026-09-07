import { api } from './client';
import type { Tag } from '$lib/types/api';

export const tagsApi = {
	getAll: () => api.get<Tag[]>('/tags'),
	getById: (id: number) => api.get<Tag>(`/tags/${id}`),
	create: (name: string) => api.post<Tag>('/tags', { Name: name }),
	update: (id: number, name: string) => api.put<Tag>(`/tags/${id}`, { Name: name }),
	delete: (id: number) => api.delete<void>(`/tags/${id}`)
};
