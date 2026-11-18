<script lang="ts">
	import { resolve } from '$app/paths';
	import { Icon } from '@heroics/ui';
	import { Spring } from 'svelte/motion';
	import { APPS, type AppDef } from '$lib/apps';
	import { queue, shell } from '$lib/state.svelte';

	let { current }: { current: AppDef } = $props();

	const index = $derived(APPS.findIndex((a) => a.id === current.id));
	const pill = new Spring(0, { stiffness: 0.16, damping: 0.62 });
	$effect(() => {
		pill.target = index;
	});
	const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
</script>

<nav class="rail" aria-label="Apps">
	<a class="mark" href={resolve('/')} aria-label="Heroics HQ">
		<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
			<path d="M16 4l10 4.4v7.1c0 6.4-4.3 11.7-10 13.7-5.7-2-10-7.3-10-13.7V8.4L16 4z" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" />
			<path d="M12.2 11v10M19.8 11v10M12.2 16h7.6" stroke="var(--paper)" stroke-width="2.2" stroke-linecap="round" />
		</svg>
	</a>

	<div class="apps" style:--i={pill.current}>
		<span class="pill" aria-hidden="true"></span>
		{#each APPS as app (app.id)}
			<a
				class="app"
				class:active={app.id === current.id}
				href={resolve(app.sections[0]!.href)}
				aria-current={app.id === current.id ? 'page' : undefined}
				style:--hue={app.hue}
			>
				<Icon name={app.icon} size={22} />
				<span class="tip" role="tooltip">{app.name} <span class="dim">{mod}{app.shortcut}</span></span>
				<span class="name">{app.name}</span>
			</a>
		{/each}
	</div>

	<div class="tools">
		<button class="tool" onclick={() => (shell.paletteOpen = true)} aria-label="Search and commands">
			<Icon name="search" size={20} />
		</button>
		<button class="tool agent" onclick={() => (shell.agentOpen = !shell.agentOpen)} aria-label="Ask Heroics" aria-expanded={shell.agentOpen}>
			<Icon name="sparkle" size={20} />
			{#if queue.items.length}
				<span class="count num">{queue.items.length}</span>
			{/if}
		</button>
		<span class="avatar" aria-label="Signed in">YO</span>
	</div>
</nav>

<style>
	.rail {
		position: relative;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-5);
		width: 76px;
		padding: var(--s-4) 0;
		border-right: 1px solid var(--line);
		background: color-mix(in oklab, var(--night-deep) 55%, transparent);
		backdrop-filter: blur(20px);
	}
	.mark {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--r-sm);
		transition: transform var(--dur) var(--ease-spring);
	}
	.mark:hover {
		transform: rotate(-6deg) scale(1.06);
	}
	.apps {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.pill {
		position: absolute;
		left: 0;
		top: 0;
		width: 48px;
		height: 48px;
		border-radius: var(--r-md);
		background: var(--accent-soft);
		border: 1px solid var(--accent-line);
		box-shadow:
			0 0 24px color-mix(in oklab, var(--accent) 35%, transparent),
			inset 0 0 12px color-mix(in oklab, var(--accent) 18%, transparent);
		transform: translateY(calc(var(--i) * 56px));
		transition:
			background var(--dur-slow) var(--ease-out),
			border-color var(--dur-slow) var(--ease-out);
	}
	.app {
		position: relative;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: var(--r-md);
		color: var(--mist-dim);
		transition:
			color var(--dur) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	.app:hover {
		color: var(--hue);
	}
	.app:active {
		transform: scale(0.92);
	}
	.app.active {
		color: var(--accent);
	}
	.name {
		display: none;
	}
	.tip {
		position: absolute;
		left: 60px;
		padding: 6px 10px;
		border-radius: var(--r-sm);
		background: var(--slate-2);
		border: 1px solid var(--line);
		color: var(--paper);
		font-size: var(--t-sm);
		font-weight: 600;
		white-space: nowrap;
		opacity: 0;
		transform: translateX(-4px);
		pointer-events: none;
		transition:
			opacity var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	.app:hover .tip,
	.app:focus-visible .tip {
		opacity: 1;
		transform: none;
	}
	.tools {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
	}
	.tool {
		position: relative;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--r-sm);
		color: var(--mist);
		transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
	}
	.tool:hover {
		background: var(--slate);
		color: var(--paper);
	}
	.agent {
		color: var(--accent);
	}
	.count {
		position: absolute;
		top: 4px;
		right: 3px;
		min-width: 17px;
		height: 17px;
		padding: 0 4px;
		border-radius: var(--r-pill);
		background: var(--accent);
		color: var(--night-deep);
		font-size: 10.5px;
		font-weight: 700;
		display: grid;
		place-items: center;
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		margin-top: var(--s-2);
		border-radius: 50%;
		background: linear-gradient(140deg, var(--slate-3), var(--slate));
		border: 1px solid var(--line-strong);
		font-size: 11px;
		font-weight: 700;
		color: var(--paper);
	}

	/* Phone: the rail becomes a bottom tab bar. */
	@media (max-width: 760px) {
		.rail {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			top: auto;
			flex-direction: row;
			width: 100%;
			height: calc(64px + env(safe-area-inset-bottom));
			padding: 0 var(--s-3) env(safe-area-inset-bottom);
			border-right: 0;
			border-top: 1px solid var(--line);
			justify-content: space-between;
		}
		.mark,
		.avatar,
		.tool:first-child {
			display: none;
		}
		.apps {
			flex-direction: row;
			flex: 1;
			justify-content: space-around;
		}
		.pill {
			display: none;
		}
		.app {
			width: auto;
			height: 56px;
			padding: 0 var(--s-2);
			gap: 2px;
		}
		.app.active::after {
			content: '';
			position: absolute;
			bottom: 4px;
			width: 18px;
			height: 3px;
			border-radius: 3px;
			background: var(--accent);
			box-shadow: 0 0 10px var(--accent);
		}
		.name {
			display: block;
			font-size: 11px;
			font-weight: 600;
		}
		.tip {
			display: none;
		}
		.tools {
			margin: 0;
			flex-direction: row;
		}
	}
</style>
