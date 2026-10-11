import { api } from './client';
import type { Domain, DomainUpdateInput, DomainWithKNs } from '$lib/types/api';

export const domainsApi = {
	/** Archived domains are left out unless includeArchived is set. */
	getAll: (includeArchived = false) =>
		api.get<Domain[]>(`/domains${includeArchived ? '?includeArchived=true' : ''}`),
	getById: (id: number) => api.get<DomainWithKNs>(`/domains/${id}`),
	create: (input: { DomainName: string; DomainDescription: string; DomainStatus: string }) =>
		api.post<Domain>('/domains', input),
	update: (id: number, input: DomainUpdateInput) => api.put<Domain>(`/domains/${id}`, input),
	/** Archiving a domain also archives its knowledge nodes; unarchiving restores them. */
	archive: (id: number) => api.put<Domain>(`/domains/${id}/archive`),
	unarchive: (id: number) => api.put<Domain>(`/domains/${id}/unarchive`),
	delete: (id: number) => api.delete<{ message: string }>(`/domains/${id}`)
};
