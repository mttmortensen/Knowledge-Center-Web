import { api } from './client';
import type {
	ActionItem,
	ActionItemCreateInput,
	ActionItemUpdateInput,
	LogStreak,
	CtpDayCount
} from '$lib/types/api';

export const actionsApi = {
	getOpenForNode: (nodeId: number) => api.get<ActionItem[]>(`/actions/knowledge-node/${nodeId}`),
	getCompletedForNode: (nodeId: number) =>
		api.get<ActionItem[]>(`/actions/knowledge-node/${nodeId}/completed`),
	getAllOpen: () => api.get<ActionItem[]>('/actions/open'),
	getAllCompleted: () => api.get<ActionItem[]>('/actions/completed'),
	getStreak: () => api.get<LogStreak>('/actions/streak'),
	getHeatmap: (days = 371) => api.get<CtpDayCount[]>(`/actions/heatmap?days=${days}`),
	getById: (id: number) => api.get<ActionItem>(`/actions/${id}`),
	create: (input: ActionItemCreateInput) => api.post<ActionItem>('/actions', input),
	update: (id: number, input: ActionItemUpdateInput) => api.put<ActionItem>(`/actions/${id}`, input),
	complete: (id: number) => api.put<ActionItem>(`/actions/${id}/complete`),
	reopen: (id: number) => api.put<ActionItem>(`/actions/${id}/reopen`),
	delete: (id: number) => api.delete<void>(`/actions/${id}`)
};
