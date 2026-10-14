import { api } from './client';
import type { Domain, KnowledgeNode, KnowledgeNodeUpdateInput, KnowledgeNodeWithLogs } from '$lib/types/api';

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
	/**
	 * Creates a domain from the node and moves the node (with its logs and actions) under it.
	 * Blank names fall back to the node's title.
	 */
	promote: (id: number, input: { DomainName?: string; KnowledgeNodeTitle?: string } = {}) =>
		api.post<Domain>(`/knowledge-nodes/${id}/promote`, input),
	delete: (id: number) => api.delete<{ message: string }>(`/knowledge-nodes/${id}`)
};
