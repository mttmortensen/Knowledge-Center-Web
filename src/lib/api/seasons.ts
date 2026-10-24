import { api, ApiError } from './client';
import type {
	Season,
	SeasonCreateInput,
	SeasonDetails,
	SeasonDomainInput,
	SeasonOverloadAck,
	SeasonOverloadWarning,
	SeasonStatus,
	SeasonUpdateInput
} from '$lib/types/api';

/** Either the lineup was saved, or the API wants the focus overload confirmed first. */
export type SetDomainsResult = { saved: SeasonDetails } | { warning: SeasonOverloadWarning };

function isOverloadWarning(body: unknown): body is SeasonOverloadWarning {
	return (body as SeasonOverloadWarning | undefined)?.Warning === 'FocusOverload';
}

export const seasonsApi = {
	/** In date order. No domains or stats. */
	getAll: (status?: SeasonStatus) =>
		api.get<Season[]>(status ? `/seasons?status=${status}` : '/seasons'),
	/** The active season, or null when none is (the API answers 204). */
	getCurrent: async () => (await api.get<SeasonDetails | undefined>('/seasons/current')) ?? null,
	getById: (id: number) => api.get<SeasonDetails>(`/seasons/${id}`),
	create: (input: SeasonCreateInput) => api.post<SeasonDetails>('/seasons', input),
	update: (id: number, input: SeasonUpdateInput) => api.put<SeasonDetails>(`/seasons/${id}`, input),
	delete: (id: number) => api.delete<void>(`/seasons/${id}`),

	/**
	 * Replaces the whole lineup. A third (or later) Focus domain comes back as a
	 * warning instead of saving; resend the same lineup with an ack to go ahead.
	 * Any other 409 (e.g. the season has ended) still throws.
	 */
	async setDomains(
		id: number,
		domains: SeasonDomainInput[],
		ack?: SeasonOverloadAck
	): Promise<SetDomainsResult> {
		try {
			const saved = await api.put<SeasonDetails>(`/seasons/${id}/domains`, {
				Domains: domains,
				OverloadAck: ack
			});
			return { saved };
		} catch (err) {
			if (err instanceof ApiError && err.status === 409 && isOverloadWarning(err.body)) {
				return { warning: err.body };
			}
			throw err;
		}
	},

	start: (id: number) => api.post<SeasonDetails>(`/seasons/${id}/start`),
	end: (id: number, reflection?: string) =>
		api.post<SeasonDetails>(`/seasons/${id}/end`, { Reflection: reflection }),
	/** Ends the active season (with its reflection) and starts this planned one. */
	rotateTo: (id: number, reflection?: string) =>
		api.post<SeasonDetails>(`/seasons/${id}/rotate`, { Reflection: reflection })
};
