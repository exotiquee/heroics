<script lang="ts">
	import '@fontsource-variable/bricolage-grotesque';
	import '@fontsource-variable/instrument-sans';
	import '@heroics/ui/tokens.css';
	import '@heroics/ui/base.css';
	import '../app.css';

	import { goto, onNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { APPS, appFor, isActive } from '$lib/apps';
	import { shell } from '$lib/state.svelte';
	import HueField from '$lib/components/HueField.svelte';
	import Rail from '$lib/components/Rail.svelte';
	import AppNav from '$lib/components/AppNav.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import AgentPanel from '$lib/components/AgentPanel.svelte';
	import Toasts from '$lib/components/Toasts.svelte';

	let { children } = $props();

	const app = $derived(appFor(page.route.id ?? '/'));

	$effect(() => {
		document.documentElement.dataset.app = app.id;
		document.title = `${app.name} · Heroics`;
	});

	// Cross-fade between screens with the View Transitions API where supported.
	onNavigate((nav) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (nav.from?.route.id === nav.to?.route.id) return;
		return new Promise((done) => {
			document.startViewTransition(async () => {
				done();
				await nav.complete;
			});
		});
	});

	function onKey(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			shell.paletteOpen = !shell.paletteOpen;
		} else if (mod && e.key.toLowerCase() === 'j') {
			e.preventDefault();
			shell.agentOpen = !shell.agentOpen;
		} else if (mod && /^[1-4]$/.test(e.key)) {
			e.preventDefault();
			const target = APPS[Number(e.key) - 1];
			if (target) goto(resolve(target.sections[0]!.href));
		} else if (e.key === 'Escape' && shell.agentOpen) {
			shell.agentOpen = false;
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<HueField />

<div class="shell">
	<Rail current={app} />
	<AppNav {app} />
	<main>
		<nav class="mobile-sections" aria-label="{app.name} sections">
			{#each app.sections as s (s.href)}
				{@const active = isActive(s.href, page.route.id ?? '/')}
				<a href={resolve(s.href)} class:active aria-current={active ? 'page' : undefined}>{s.label}</a>
			{/each}
		</nav>
		<div class="page">
			{@render children()}
		</div>
	</main>
</div>

<CommandPalette />
<AgentPanel />
<Toasts />

<style>
	.shell {
		position: relative;
		z-index: 1;
		display: flex;
		height: 100dvh;
	}
	main {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
	}
	.page {
		view-transition-name: page;
		max-width: 1240px;
		margin: 0 auto;
		padding: var(--s-7) clamp(var(--s-4), 4vw, var(--s-7)) var(--s-8);
	}
	.mobile-sections {
		display: none;
	}
	@media (max-width: 760px) {
		.shell {
			height: auto;
			min-height: 100dvh;
		}
		main {
			overflow: visible;
			padding-bottom: calc(76px + env(safe-area-inset-bottom));
		}
		.page {
			padding-top: var(--s-5);
		}
		.mobile-sections {
			position: sticky;
			top: 0;
			z-index: 5;
			display: flex;
			gap: var(--s-2);
			padding: calc(var(--s-3) + env(safe-area-inset-top)) var(--s-4) var(--s-3);
			overflow-x: auto;
			background: color-mix(in oklab, var(--night) 82%, transparent);
			backdrop-filter: blur(16px);
			border-bottom: 1px solid var(--line);
			scrollbar-width: none;
		}
		.mobile-sections a {
			flex: none;
			height: 32px;
			padding: 0 14px;
			display: inline-flex;
			align-items: center;
			border-radius: var(--r-pill);
			font-size: var(--t-sm);
			font-weight: 600;
			color: var(--mist);
			background: var(--slate);
		}
		.mobile-sections a.active {
			color: var(--night-deep);
			background: var(--accent);
		}
	}
</style>
