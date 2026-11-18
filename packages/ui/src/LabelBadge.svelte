<script lang="ts">
	import { LABEL_COPY, type Label } from '@heroics/policy';
	import Icon from './Icon.svelte';

	let { label, compact = false }: { label: Label; compact?: boolean } = $props();
	const copy = $derived(LABEL_COPY[label]);
</script>

<span class="badge" style:--c="var(--label-{label})" title="{copy.name}: {copy.rule}">
	<Icon name={label === 'sealed' || label === 'private' ? 'lock' : label === 'personal' ? 'shield' : 'cloud'} size={12} stroke={2} />
	{#if !compact}{copy.name}{/if}
	<span class="sr-only">{copy.rule}</span>
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 20px;
		padding: 0 8px;
		border-radius: var(--r-pill);
		font-size: 11px;
		font-weight: 600;
		color: var(--c);
		background: color-mix(in oklab, var(--c) 14%, transparent);
		white-space: nowrap;
	}
</style>
