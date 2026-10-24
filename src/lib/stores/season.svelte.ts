import { seasonsApi } from '$lib/api/seasons';
import { auth } from './auth.svelte';
import type { SeasonDetails, SeasonRole } from '$lib/types/api';

// The active season, shared by every screen that shows it (dashboard strip,
// domains table, domain page) so it's fetched once per login, not per page.
// It remembers which token it loaded for, so logging in as someone else (or
// into demo mode) reloads it without the auth store knowing about seasons.

class CurrentSeasonState {
	season = $state<SeasonDetails | null>(null);
	loaded = $state(false);

	#loadedFor: string | null = null;
	#pending: Promise<void> | null = null;

	/** Loads the active season unless it's already loaded for this login. */
	ensure(): Promise<void> {
		if (this.loaded && this.#loadedFor === auth.token) return Promise.resolve();
		return this.#pending ?? this.refresh();
	}

	refresh(): Promise<void> {
		const token = auth.token;
		this.#pending = seasonsApi
			.getCurrent()
			.then((season) => {
				this.set(season);
				this.#loadedFor = token;
			})
			.finally(() => {
				this.#pending = null;
			});
		return this.#pending;
	}

	/** For write endpoints that already return the season, or null once it has ended. */
	set(season: SeasonDetails | null) {
		this.season = season && season.Status === 'Active' ? season : null;
		this.loaded = true;
		this.#loadedFor = auth.token;
	}

	/** A domain's role this season; null when no season is active. */
	roleOf(domainId: number): SeasonRole | 'Resting' | null {
		if (!this.season) return null;
		return this.season.Domains.find((d) => d.DomainId === domainId)?.Role ?? 'Resting';
	}
}

export const currentSeason = new CurrentSeasonState();
