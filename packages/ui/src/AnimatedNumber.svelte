<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let {
		value,
		format = (n: number) => Math.round(n).toLocaleString('de-CH'),
		duration = 900
	}: { value: number; format?: (n: number) => string; duration?: number } = $props();

	const reduce =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const tween = new Tween(0, { easing: cubicOut });

	$effect(() => {
		tween.set(value, { duration: reduce ? 0 : duration });
	});
</script>

<span class="num">{format(tween.current)}</span>
