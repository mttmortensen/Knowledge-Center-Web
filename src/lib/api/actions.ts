import { api } from './client';
import type {
	ActionItem,
	ActionItemCreateInput,
	ActionItemUpdateInput,
	RecentAction
} from '$lib/types/api';

export const actionsApi = {
	getOpenForNode: (nodeId: number) => api.get<ActionItem[]>(`/actions/knowledge-node/${nodeId}`),
	getCompletedForNode: (nodeId: number) =>
		api.get<ActionItem[]>(`/actions/knowledge-node/${nodeId}/completed`),
	getAllOpen: () => api.get<ActionItem[]>('/actions/open'),
	getAllCompleted: () => api.get<ActionItem[]>('/actions/completed'),
	getRecent: (limit = 5) => api.get<RecentAction[]>(`/actions/recent?limit=${limit}`),
	getById: (id: number) => api.get<ActionItem>(`/actions/${id}`),
	create: (input: ActionItemCreateInput) => api.post<ActionItem>('/actions', input),
	update: (id: number, input: ActionItemUpdateInput) => api.put<ActionItem>(`/actions/${id}`, input),
	/** A blank followUp leaves any existing note alone. */
	complete: (id: number, followUp?: string) =>
		api.put<ActionItem>(`/actions/${id}/complete`, followUp ? { FollowUp: followUp } : undefined),
	/** Completed actions only; a blank followUp clears the note. */
	updateFollowUp: (id: number, followUp: string) =>
		api.put<ActionItem>(`/actions/${id}/follow-up`, { FollowUp: followUp }),
	/** Status, dates and follow-up are kept. */
	move: (id: number, nodeId: number) =>
		api.put<ActionItem>(`/actions/${id}/move`, { KnowledgeNodeId: nodeId }),
	reopen: (id: number) => api.put<ActionItem>(`/actions/${id}/reopen`),
	delete: (id: number) => api.delete<void>(`/actions/${id}`)
};
