import { api } from './client';
import type { Domain, DomainUpdateInput, DomainWithKNs } from '$lib/types/api';

export const domainsApi = {
	getAll: () => api.get<Domain[]>('/domains'),
	getById: (id: number) => api.get<DomainWithKNs>(`/domains/${id}`),
	create: (input: { DomainName: string; DomainDescription: string; DomainStatus: string }) =>
		api.post<Domain>('/domains', input),
	update: (id: number, input: DomainUpdateInput) => api.put<Domain>(`/domains/${id}`, input),
	delete: (id: number) => api.delete<{ message: string }>(`/domains/${id}`)
};
