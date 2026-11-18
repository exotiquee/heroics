<script lang="ts">
	import { ICONS, type IconName } from './icons.ts';

	let {
		name,
		size = 20,
		stroke = 1.75,
		label
	}: { name: IconName; size?: number; stroke?: number; label?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	style="flex: none"
>
	<path d={ICONS[name]} />
</svg>
