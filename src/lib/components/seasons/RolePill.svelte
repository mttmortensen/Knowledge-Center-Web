<script lang="ts">
	import type { SeasonStatsRole } from '$lib/types/api';

	// A season role, optionally labelled with a domain name instead of the role itself.
	let { role, label }: { role: SeasonStatsRole | 'Resting'; label?: string } = $props();
</script>

<span class="role-pill {role.toLowerCase()}" title={label ? role : undefined}>{label ?? role}</span>
