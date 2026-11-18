<script lang="ts">
	import type { Tier } from '@heroics/policy';
	import Icon from './Icon.svelte';

	let { tier }: { tier: Tier } = $props();
	const copy = { device: 'On device', box: 'Your server', cloud: 'Cloud AI' } as const;
	const icon = { device: 'phone', box: 'server', cloud: 'cloud' } as const;
</script>

<span class="tier tier-{tier}">
	<Icon name={icon[tier]} size={12} stroke={2} />
	{copy[tier]}
</span>

<style>
	.tier {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		height: 20px;
		padding: 0 8px;
		border-radius: var(--r-pill);
		font-size: 11px;
		font-weight: 600;
		border: 1px solid var(--line-strong);
		color: var(--mist);
		white-space: nowrap;
	}
	.tier-cloud {
		color: var(--label-personal);
		border-color: color-mix(in oklab, var(--label-personal) 40%, transparent);
	}
</style>
