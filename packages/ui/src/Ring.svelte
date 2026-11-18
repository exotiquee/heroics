<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';

	let {
		value,
		size = 120,
		stroke = 10,
		color = 'var(--accent)',
		track = 'var(--slate-2)',
		label,
		children
	}: {
		/** 0..1; values above 1 draw a full ring. */
		value: number;
		size?: number;
		stroke?: number;
		color?: string;
		track?: string;
		label: string;
		children?: Snippet;
	} = $props();

	const progress = new Spring(0, { stiffness: 0.08, damping: 0.5 });
	$effect(() => {
		progress.target = Math.max(0, Math.min(1, value));
	});

	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
</script>

<div class="ring" style:width="{size}px" style:height="{size}px" role="img" aria-label={label}>
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={track} stroke-width={stroke} />
		<circle
			cx={size / 2}
			cy={size / 2}
			{r}
			fill="none"
			stroke={color}
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={c}
			stroke-dashoffset={c * (1 - Math.max(0, Math.min(1, progress.current)))}
			transform="rotate(-90 {size / 2} {size / 2})"
			style="filter: drop-shadow(0 0 6px {color})"
		/>
	</svg>
	{#if children}
		<div class="center">{@render children()}</div>
	{/if}
</div>

<style>
	.ring {
		position: relative;
		flex: none;
	}
	.center {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		text-align: center;
	}
</style>
