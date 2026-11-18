<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<kbd>{@render children()}</kbd>

<style>
	kbd {
		display: inline-grid;
		place-items: center;
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		border-radius: 5px;
		border: 1px solid var(--line-strong);
		border-bottom-width: 2px;
		font-family: var(--font-body);
		font-size: 11px;
		font-weight: 600;
		color: var(--mist);
		background: var(--night-deep);
	}
</style>
