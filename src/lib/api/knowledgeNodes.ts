import { api } from './client';
import type { KnowledgeNode, KnowledgeNodeUpdateInput, KnowledgeNodeWithLogs } from '$lib/types/api';

export const knowledgeNodesApi = {
	getAll: () => api.get<KnowledgeNode[]>('/knowledge-nodes'),
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
	delete: (id: number) => api.delete<{ message: string }>(`/knowledge-nodes/${id}`)
};
