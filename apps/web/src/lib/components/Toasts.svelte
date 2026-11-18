<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { dismiss, toasts } from '$lib/state.svelte';
</script>

<div class="toasts" aria-live="polite">
	{#each toasts.items as t (t.id)}
		<div class="toast" animate:flip={{ duration: 220 }} in:fly={{ y: -16, duration: 260 }} out:fly={{ y: -8, duration: 180 }}>
			<span>{t.text}</span>
			{#if t.action && t.run}
				<button
					onclick={() => {
						t.run?.();
						dismiss(t.id);
					}}>{t.action}</button
				>
			{/if}
		</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		z-index: 50;
		left: 50%;
		top: 20px;
		translate: -50% 0;
		display: grid;
		gap: var(--s-2);
		justify-items: center;
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--s-4);
		padding: 10px 12px 10px 16px;
		border-radius: var(--r-pill);
		background: var(--paper);
		color: var(--night-deep);
		font-size: var(--t-sm);
		font-weight: 600;
		box-shadow: 0 12px 30px -10px rgb(0 0 0 / 0.6);
		max-width: calc(100vw - 32px);
	}
	button {
		font-weight: 700;
		color: var(--night-deep);
		padding: 4px 10px;
		border-radius: var(--r-pill);
		background: rgb(19 26 44 / 0.08);
	}
	@media (max-width: 760px) {
		.toasts {
			top: calc(12px + env(safe-area-inset-top));
		}
	}
</style>
