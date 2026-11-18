<script lang="ts">
	import { Spring } from 'svelte/motion';

	let {
		value,
		max,
		color = 'var(--accent)',
		height = 6,
		label,
		marker
	}: {
		value: number;
		max: number;
		color?: string;
		height?: number;
		label: string;
		/** Optional target marker as a fraction of max (0..1). */
		marker?: number;
	} = $props();

	const ratio = $derived(max > 0 ? value / max : 0);
	const width = new Spring(0, { stiffness: 0.09, damping: 0.55 });
	$effect(() => {
		width.target = Math.min(1, Math.max(0, ratio));
	});
	const over = $derived(ratio > 1);
</script>

<div
	class="meter"
	style:height="{height}px"
	role="meter"
	aria-label={label}
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
>
	<div class="fill" class:over style:width="{width.current * 100}%" style:--c={color}></div>
	{#if marker !== undefined}
		<div class="marker" style:left="{marker * 100}%"></div>
	{/if}
</div>

<style>
	.meter {
		position: relative;
		width: 100%;
		background: var(--slate-2);
		border-radius: var(--r-pill);
		overflow: visible;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		background: var(--c);
		box-shadow: 0 0 12px color-mix(in oklab, var(--c) 55%, transparent);
	}
	.fill.over {
		background: var(--bad);
		box-shadow: 0 0 12px color-mix(in oklab, var(--bad) 55%, transparent);
	}
	.marker {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		background: var(--paper);
		opacity: 0.6;
		border-radius: 1px;
	}
</style>
