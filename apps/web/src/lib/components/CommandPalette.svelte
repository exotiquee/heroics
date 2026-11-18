<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Icon, Kbd, type IconName } from '@heroics/ui';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { APPS, type AppId } from '$lib/apps';
	import { shell, toast } from '$lib/state.svelte';

	interface Command {
		id: string;
		label: string;
		hint: string;
		icon: IconName;
		app: AppId;
		run: () => void;
	}

	const commands: Command[] = [
		...APPS.flatMap((app) =>
			app.sections.map((s) => ({
				id: `${app.id}:${s.href}`,
				label: s.label === 'Today' || s.label === 'Overview' || s.label === 'Board' ? `${app.name} · ${s.label}` : s.label,
				hint: `Go to ${app.name}`,
				icon: s.icon,
				app: app.id,
				run: () => goto(resolve(s.href))
			}))
		),
		{ id: 'start', label: 'Start today’s workout', hint: 'Lower A · 5 exercises', icon: 'play', app: 'fitness', run: () => goto(resolve('/fitness/workout')) },
		{ id: 'meal', label: 'Log a meal', hint: 'Barcode, label scan or search', icon: 'leaf', app: 'fitness', run: () => goto(resolve('/fitness/nutrition')) },
		{ id: 'receipt', label: 'Scan a receipt', hint: 'Runs on your phone, never uploaded', icon: 'receipt', app: 'finance', run: () => toast('Open Heroics Finance on your phone to scan. The image stays on the device.') },
		{ id: 'review', label: 'Review uncategorised transactions', hint: '4 waiting', icon: 'inbox', app: 'finance', run: () => goto(resolve('/finance/transactions')) },
		{ id: 'task', label: 'New task in Heroics suite', hint: 'Adds to To do', icon: 'plus', app: 'projects', run: () => goto(resolve('/projects')) },
		{ id: 'invoice', label: 'Draft an invoice', hint: 'Alpine Dental · 19 billable hours', icon: 'qr', app: 'projects', run: () => goto(resolve('/projects/time')) },
		{ id: 'ask', label: 'Ask Heroics', hint: 'Open the assistant', icon: 'sparkle', app: 'hq', run: () => (shell.agentOpen = true) },
		{ id: 'ledger', label: 'See what left this device', hint: 'Privacy ledger', icon: 'shield', app: 'hq', run: () => goto(resolve('/ledger')) }
	];

	const hue: Record<AppId, string> = { hq: 'var(--gold)', fitness: 'var(--ember)', finance: 'var(--jade)', projects: 'var(--iris)' };

	let query = $state('');
	let selected = $state(0);
	let input = $state<HTMLInputElement>();

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return commands;
		return commands
			.map((c) => ({ c, score: score(c, q) }))
			.filter((r) => r.score > 0)
			.sort((a, b) => b.score - a.score)
			.map((r) => r.c);
	});

	function score(c: Command, q: string): number {
		const hay = `${c.label} ${c.hint} ${c.app}`.toLowerCase();
		if (hay.startsWith(q)) return 3;
		if (hay.includes(q)) return 2;
		let i = 0;
		for (const ch of hay) if (ch === q[i]) i++;
		return i === q.length ? 1 : 0;
	}

	$effect(() => {
		if (shell.paletteOpen) {
			query = '';
			selected = 0;
			queueMicrotask(() => input?.focus());
		}
	});

	$effect(() => {
		void query;
		selected = 0;
	});

	function run(c: Command | undefined) {
		if (!c) return;
		shell.paletteOpen = false;
		c.run();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selected = Math.min(results.length - 1, selected + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selected = Math.max(0, selected - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			run(results[selected]);
		} else if (e.key === 'Escape') {
			shell.paletteOpen = false;
		}
	}
</script>

{#if shell.paletteOpen}
	<div class="scrim" transition:fade={{ duration: 140 }} onclick={() => (shell.paletteOpen = false)} aria-hidden="true"></div>
	<div class="palette surface" role="dialog" aria-modal="true" aria-label="Search and commands" transition:scale={{ start: 0.96, duration: 180, easing: cubicOut }}>
		<div class="field">
			<Icon name="search" size={20} />
			<input
				bind:this={input}
				bind:value={query}
				onkeydown={onKey}
				placeholder="Search apps, screens and actions"
				aria-label="Search"
				aria-controls="palette-results"
				aria-activedescendant={results[selected] ? `cmd-${results[selected]?.id}` : undefined}
				role="combobox"
				aria-expanded="true"
			/>
			<Kbd>esc</Kbd>
		</div>
		<ul id="palette-results" role="listbox">
			{#each results as c, i (c.id)}
				<li
					id="cmd-{c.id}"
					role="option"
					aria-selected={i === selected}
					class:sel={i === selected}
					style:--hue={hue[c.app]}
					onpointermove={() => (selected = i)}
					onclick={() => run(c)}
					onkeydown={() => {}}
				>
					<span class="ico"><Icon name={c.icon} size={18} /></span>
					<span class="label">{c.label}</span>
					<span class="hint dim">{c.hint}</span>
				</li>
			{:else}
				<li class="empty dim">Nothing matches “{query}”. Try an app name or an action like “invoice”.</li>
			{/each}
		</ul>
		<footer class="dim">
			<span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
			<span><Kbd>↵</Kbd> to open</span>
		</footer>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgb(6 10 22 / 0.55);
		backdrop-filter: blur(4px);
	}
	.palette {
		position: fixed;
		z-index: 41;
		top: 14vh;
		left: 50%;
		width: min(640px, calc(100vw - 32px));
		translate: -50% 0;
		background: color-mix(in oklab, var(--slate) 92%, transparent);
		overflow: hidden;
	}
	.field {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		padding: var(--s-4) var(--s-5);
		border-bottom: 1px solid var(--line);
		color: var(--mist);
	}
	input {
		flex: 1;
		background: none;
		border: 0;
		outline: none;
		font-size: var(--t-lg);
		color: var(--paper);
	}
	input::placeholder {
		color: var(--mist-dim);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: var(--s-2);
		max-height: 52vh;
		overflow-y: auto;
	}
	li {
		display: grid;
		grid-template-columns: 32px 1fr auto;
		align-items: center;
		gap: var(--s-3);
		height: 46px;
		padding: 0 var(--s-3);
		border-radius: var(--r-sm);
		cursor: pointer;
	}
	li.sel {
		background: color-mix(in oklab, var(--hue) 13%, transparent);
	}
	.ico {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: color-mix(in oklab, var(--hue) 16%, transparent);
		color: var(--hue);
	}
	.label {
		font-weight: 600;
	}
	.hint {
		font-size: var(--t-sm);
	}
	.empty {
		display: block;
		height: auto;
		padding: var(--s-5);
		cursor: default;
	}
	footer {
		display: flex;
		gap: var(--s-5);
		padding: var(--s-3) var(--s-5);
		border-top: 1px solid var(--line);
		font-size: var(--t-xs);
	}
	@media (max-width: 760px) {
		.hint {
			display: none;
		}
	}
</style>
