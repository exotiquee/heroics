<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, sub, actions }: { title: string; sub?: string; actions?: Snippet } = $props();
</script>

<header class="ph">
	<div>
		<h1>{title}</h1>
		{#if sub}<p class="muted">{sub}</p>{/if}
	</div>
	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</header>

<style>
	.ph {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--s-4);
		flex-wrap: wrap;
		margin-bottom: var(--s-6);
	}
	h1 {
		font-size: clamp(1.75rem, 1.2rem + 1.6vw, 2.5rem);
		font-weight: 650;
		letter-spacing: -0.035em;
	}
	p {
		margin-top: 6px;
		max-width: 62ch;
	}
	.actions {
		display: flex;
		gap: var(--s-2);
		flex-wrap: wrap;
	}
</style>
