import { api } from './client';
import type { Stats } from '$lib/types/api';

export const statsApi = {
	get: () => api.get<Stats>('/stats')
};
