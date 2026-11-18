<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Icon } from '@heroics/ui';
	import { isActive, type AppDef } from '$lib/apps';
	import { queue } from '$lib/state.svelte';

	let { app }: { app: AppDef } = $props();

	const pending = $derived(queue.items.filter((a) => a.app === app.id).length);
</script>

<aside class="nav" aria-label="{app.name} sections">
	<header>
		{#key app.id}
			<div class="title">
				<h2>{app.name}</h2>
				<p class="dim">{app.tagline}</p>
			</div>
		{/key}
	</header>

	<ul>
		{#each app.sections as s (s.href)}
			{@const active = isActive(s.href, page.route.id ?? '/')}
			<li>
				<a href={resolve(s.href)} class:active aria-current={active ? 'page' : undefined}>
					<Icon name={s.icon} size={18} />
					<span>{s.label}</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if pending && app.id !== 'hq'}
		<p class="pending">
			<span class="dot"></span>
			{pending} {pending === 1 ? 'proposal' : 'proposals'} from Heroics waiting for you
		</p>
	{/if}

	<footer class="dim">
		<Icon name="shield" size={14} />
		<span>Local-first. Cloud AI only with your grant.</span>
	</footer>
</aside>

<style>
	.nav {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		width: 232px;
		padding: var(--s-5) var(--s-3) var(--s-4);
		border-right: 1px solid var(--line);
		background: color-mix(in oklab, var(--night-deep) 30%, transparent);
	}
	header {
		padding: 0 var(--s-3) var(--s-5);
		min-height: 74px;
	}
	.title {
		animation: rise var(--dur-slow) var(--ease-spring);
	}
	h2 {
		font-size: var(--t-xl);
		color: var(--paper);
	}
	h2::after {
		content: '';
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-left: 8px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 12px var(--accent);
		vertical-align: middle;
	}
	header p {
		font-size: var(--t-sm);
		margin-top: 4px;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 2px;
	}
	a {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--s-3);
		height: 40px;
		padding: 0 var(--s-3);
		border-radius: var(--r-sm);
		color: var(--mist);
		font-weight: 500;
		transition:
			background var(--dur-fast) var(--ease-out),
			color var(--dur-fast) var(--ease-out);
	}
	a:hover {
		background: color-mix(in oklab, var(--slate) 70%, transparent);
		color: var(--paper);
	}
	a.active {
		color: var(--paper);
		background: color-mix(in oklab, var(--accent) 10%, var(--slate) 40%);
	}
	a.active::before {
		content: '';
		position: absolute;
		left: -12px;
		top: 10px;
		bottom: 10px;
		width: 3px;
		border-radius: 3px;
		background: var(--accent);
		box-shadow: 0 0 10px var(--accent);
	}
	a.active :global(svg) {
		color: var(--accent);
	}
	.pending {
		margin: var(--s-5) var(--s-3) 0;
		font-size: var(--t-sm);
		color: var(--mist);
		display: flex;
		gap: var(--s-2);
		align-items: baseline;
	}
	.dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
		transform: translateY(-1px);
	}
	footer {
		margin-top: auto;
		display: flex;
		gap: var(--s-2);
		align-items: flex-start;
		padding: 0 var(--s-3);
		font-size: var(--t-xs);
		line-height: 1.4;
	}
	@media (max-width: 1100px) {
		.nav {
			width: 76px;
			padding: var(--s-5) var(--s-2);
			align-items: center;
		}
		header,
		footer,
		.pending,
		a span {
			display: none;
		}
		a {
			justify-content: center;
			width: 48px;
			padding: 0;
		}
		a.active::before {
			left: -14px;
		}
	}
	@media (max-width: 760px) {
		.nav {
			display: none;
		}
	}
</style>
