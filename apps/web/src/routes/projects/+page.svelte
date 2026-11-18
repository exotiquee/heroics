<script lang="ts">
	import { Icon, Meter } from '@heroics/ui';
	import { flip } from 'svelte/animate';
	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { AiTier, TaskStatus } from '@heroics/schema';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { board, columns, people, projects, type Card } from '$lib/data/projects';
	import { fmtShort, minutes } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	let cards = $state<Card[]>(board.map((c) => ({ ...c })));
	let dragging = $state<string | null>(null);
	let over = $state<TaskStatus | null>(null);
	let tier = $state<AiTier>('cloud');
	let adding = $state(false);
	let newTitle = $state('');

	const [send, receive] = crossfade({ duration: 320, easing: cubicOut });
	const tagHue: Record<string, string> = {
		Foundation: 'var(--gold)',
		UI: 'var(--iris)',
		Fitness: 'var(--ember)',
		Finance: 'var(--jade)',
		Projects: 'var(--iris)',
		Agent: '#6fb6ff',
		Infra: 'var(--mist)'
	};
	const person = (id: string) => people.find((p) => p.id === id)!;
	const order: TaskStatus[] = ['todo', 'doing', 'review', 'done'];

	function move(id: string, status: TaskStatus) {
		const c = cards.find((x) => x.id === id);
		if (!c || c.status === status) return;
		c.status = status;
		if (status === 'done') toast(`Done: ${c.title}`);
	}

	function onKey(e: KeyboardEvent, c: Card) {
		const i = order.indexOf(c.status);
		if (e.key === 'ArrowRight' && i < 3) move(c.id, order[i + 1]!);
		if (e.key === 'ArrowLeft' && i > 0) move(c.id, order[i - 1]!);
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			requestAnimationFrame(() => document.getElementById(`card-${c.id}`)?.focus());
		}
	}

	function addTask(e: SubmitEvent) {
		e.preventDefault();
		const title = newTitle.trim();
		if (!title) return;
		cards = [{ id: `n${Date.now()}`, title, status: 'todo', assignee: 'me', tag: 'UI' }, ...cards];
		newTitle = '';
		adding = false;
	}

	function setTier(t: AiTier) {
		tier = t;
		toast(t === 'cloud' ? 'Cloud AI allowed for Heroics suite under your grant' : t === 'local' ? 'Heroics suite now uses local AI only' : 'AI is off for Heroics suite');
	}

	const doneCount = $derived(cards.filter((c) => c.status === 'done').length);
	const tierCopy: Record<AiTier, string> = {
		off: 'No AI reads this project.',
		local: 'AI runs on your devices or your server only.',
		cloud: 'Cloud AI may read tasks and public notes. Private notes never.'
	};
</script>

<PageHeader title="Heroics suite" sub="Board · {doneCount} of {cards.length} done. Drag cards between columns, or focus a card and use the arrow keys.">
	{#snippet actions()}
		<button class="btn btn-primary" onclick={() => (adding = !adding)}><Icon name="plus" size={16} /> New task</button>
	{/snippet}
</PageHeader>

<div class="meta-bar">
	<div class="tier">
		<span class="dim small">AI access</span>
		<div class="seg" role="radiogroup" aria-label="AI access for this project">
			{#each ['off', 'local', 'cloud'] as const as t (t)}
				<button role="radio" aria-checked={tier === t} class:on={tier === t} onclick={() => setTier(t)}>{t === 'off' ? 'Off' : t === 'local' ? 'Local' : 'Cloud'}</button>
			{/each}
		</div>
		<span class="dim small">{tierCopy[tier]}</span>
	</div>
	<div class="who">
		{#each people.filter((p) => !p.guest) as p (p.id)}
			<span class="av" style:--hue={p.hue} title={p.name}>{p.initials}</span>
		{/each}
	</div>
</div>

{#if adding}
	<form class="add" onsubmit={addTask}>
		<!-- svelte-ignore a11y_autofocus -->
		<input bind:value={newTitle} placeholder="What needs doing?" aria-label="Task title" autofocus />
		<button class="btn btn-primary btn-sm" disabled={!newTitle.trim()}>Add to To do</button>
	</form>
{/if}

<div class="board">
	{#each columns as col (col.status)}
		{@const items = cards.filter((c) => c.status === col.status)}
		<section
			class="col"
			class:over={over === col.status}
			aria-label={col.name}
			ondragover={(e) => {
				e.preventDefault();
				over = col.status;
			}}
			ondragleave={() => (over = null)}
			ondrop={(e) => {
				e.preventDefault();
				if (dragging) move(dragging, col.status);
				dragging = null;
				over = null;
			}}
		>
			<header>
				<h2>{col.name}</h2>
				<span class="num dim">{items.length}</span>
			</header>
			<div class="cards">
				{#each items as c (c.id)}
					<div
						id="card-{c.id}"
						class="card"
						class:lift={dragging === c.id}
						class:done={c.status === 'done'}
						draggable="true"
						tabindex="0"
						role="button"
						aria-roledescription="task card"
						aria-label="{c.title}, {col.name}. Use left and right arrow keys to move between columns."
						ondragstart={(e) => {
							dragging = c.id;
							e.dataTransfer?.setData('text/plain', c.id);
						}}
						ondragend={() => {
							dragging = null;
							over = null;
						}}
						onkeydown={(e) => onKey(e, c)}
						in:receive={{ key: c.id }}
						out:send={{ key: c.id }}
						animate:flip={{ duration: 280 }}
					>
						<p class="tag" style:--hue={tagHue[c.tag] ?? 'var(--mist)'}><span class="hue-dot"></span>{c.tag}</p>
						<p class="ct">{c.title}</p>
						<div class="cf">
							{#if c.blocked}<span class="chip blocked"><Icon name="alert" size={12} /> Blocked</span>{/if}
							{#if c.due}<span class="chip num"><Icon name="calendar" size={12} /> {fmtShort(c.due)}</span>{/if}
							{#if c.estimate}<span class="chip num"><Icon name="clock" size={12} /> {minutes(c.estimate)}</span>{/if}
							{#if c.comments}<span class="chip num"><Icon name="note" size={12} /> {c.comments}</span>{/if}
							<span class="av sm" style:--hue={person(c.assignee).hue} title={person(c.assignee).name}>{person(c.assignee).initials}</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

<section class="block">
	<h2 class="section-title">All projects</h2>
	<ul class="rows plist">
		{#each projects as p (p.id)}
			<li class="row">
				<div class="grow">
					<p class="title">{p.name}</p>
					<p class="meta">{p.workspace}{p.due ? ` · due ${fmtShort(p.due)}` : ''}{p.guests ? ` · ${p.guests} guest` : ''}</p>
					{#if p.risk}<p class="risk"><Icon name="alert" size={13} /> {p.risk}</p>{/if}
				</div>
				<div class="prog">
					<Meter value={p.done} max={p.done + p.open} label="{p.name} progress" />
					<span class="num dim small">{p.done}/{p.done + p.open}</span>
				</div>
				<span class="chip">{p.aiTier === 'off' ? 'AI off' : p.aiTier === 'local' ? 'Local AI' : 'Cloud AI'}</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	.small {
		font-size: var(--t-xs);
	}
	.meta-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--s-4);
		margin: calc(var(--s-4) * -1) 0 var(--s-5);
		flex-wrap: wrap;
	}
	.tier {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		flex-wrap: wrap;
	}
	.seg {
		display: inline-flex;
		padding: 3px;
		border-radius: var(--r-pill);
		background: var(--slate);
	}
	.seg button {
		height: 28px;
		padding: 0 12px;
		border-radius: var(--r-pill);
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--mist);
	}
	.seg button.on {
		background: var(--accent);
		color: var(--night-deep);
	}
	.who {
		display: flex;
	}
	.av {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: color-mix(in oklab, var(--hue) 30%, var(--slate));
		border: 2px solid var(--night);
		font-size: 10.5px;
		font-weight: 800;
		margin-left: -6px;
	}
	.av.sm {
		width: 24px;
		height: 24px;
		font-size: 9px;
		margin-left: auto;
		border-width: 0;
	}
	.add {
		display: flex;
		gap: var(--s-2);
		margin-bottom: var(--s-4);
		max-width: 560px;
	}
	.add input {
		flex: 1;
		height: 38px;
		padding: 0 var(--s-4);
		border-radius: var(--r-pill);
		background: var(--night-deep);
		border: 1px solid var(--accent-line);
		outline: none;
	}
	.board {
		display: grid;
		grid-template-columns: repeat(4, minmax(220px, 1fr));
		gap: var(--s-4);
		overflow-x: auto;
		padding-bottom: var(--s-2);
	}
	.col {
		border-radius: var(--r-lg);
		padding: var(--s-3);
		background: color-mix(in oklab, var(--night-deep) 45%, transparent);
		border: 1px solid var(--line);
		min-height: 320px;
		transition:
			background var(--dur) var(--ease-out),
			border-color var(--dur) var(--ease-out);
	}
	.col.over {
		background: var(--accent-soft);
		border-color: var(--accent-line);
	}
	.col header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: var(--s-1) var(--s-2) var(--s-3);
	}
	.col h2 {
		font-size: var(--t-md);
		font-weight: 600;
	}
	.col .cards {
		display: grid;
		gap: var(--s-2);
	}
	.card {
		padding: var(--s-3);
		border-radius: var(--r-md);
		background: var(--slate);
		border: 1px solid var(--line);
		cursor: grab;
		transition:
			transform var(--dur) var(--ease-spring),
			box-shadow var(--dur) var(--ease-out),
			opacity var(--dur);
	}
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 24px -14px rgb(0 0 0 / 0.8);
	}
	.card.lift {
		opacity: 0.45;
		transform: rotate(-2deg) scale(0.98);
	}
	.card.done .ct {
		color: var(--mist);
		text-decoration: line-through;
		text-decoration-color: var(--line-strong);
	}
	.tag {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 700;
		color: var(--hue);
	}
	.tag .hue-dot {
		width: 6px;
		height: 6px;
	}
	.ct {
		margin: 6px 0 var(--s-3);
		font-weight: 600;
		font-size: var(--t-sm);
		line-height: 1.35;
	}
	.cf {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.cf .chip {
		height: 22px;
		padding: 0 8px;
		font-size: 11px;
	}
	.blocked {
		color: var(--bad);
		background: color-mix(in oklab, var(--bad) 14%, transparent);
	}
	.plist {
		list-style: none;
		margin: var(--s-3) 0 0;
		padding: 0;
	}
	.prog {
		width: 160px;
		display: flex;
		align-items: center;
		gap: var(--s-2);
	}
	.risk {
		display: flex;
		gap: 6px;
		align-items: center;
		margin-top: 2px;
		font-size: var(--t-xs);
		font-weight: 600;
		color: var(--warn);
	}
	@media (max-width: 760px) {
		.board {
			grid-template-columns: repeat(4, 78vw);
			scroll-snap-type: x mandatory;
		}
		.col {
			scroll-snap-align: start;
		}
		.prog {
			display: none;
		}
	}
</style>
