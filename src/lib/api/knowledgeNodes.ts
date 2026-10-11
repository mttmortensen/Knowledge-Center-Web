import { api } from './client';
import type { KnowledgeNode, KnowledgeNodeUpdateInput, KnowledgeNodeWithLogs } from '$lib/types/api';

export const knowledgeNodesApi = {
	/** Archived nodes are left out unless includeArchived is set. */
	getAll: (includeArchived = false) =>
		api.get<KnowledgeNode[]>(`/knowledge-nodes${includeArchived ? '?includeArchived=true' : ''}`),
	getById: (id: number) => api.get<KnowledgeNodeWithLogs>(`/knowledge-nodes/${id}`),
	create: (input: {
		Title: string;
		DomainId: number;
		NodeType: string;
		Description: string;
		ConfidenceLevel: number;
		Status: string;
	}) => api.post<KnowledgeNode>('/knowledge-nodes', input),
	update: (id: number, input: KnowledgeNodeUpdateInput) =>
		api.put<KnowledgeNode>(`/knowledge-nodes/${id}`, input),
	archive: (id: number) => api.put<KnowledgeNode>(`/knowledge-nodes/${id}/archive`),
	unarchive: (id: number) => api.put<KnowledgeNode>(`/knowledge-nodes/${id}/unarchive`),
	delete: (id: number) => api.delete<{ message: string }>(`/knowledge-nodes/${id}`)
};
