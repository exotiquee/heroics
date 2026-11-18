<script lang="ts">
	import { Icon, Meter, Ring } from '@heroics/ui';
	import { fly, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { prs, todayWorkout } from '$lib/data/fitness';
	import { toast } from '$lib/state.svelte';

	interface SetRow {
		weight: number;
		reps: number;
		done: boolean;
		pr: boolean;
	}

	const best: Record<string, number> = { squat: prs.find((p) => p.lift === 'Back squat')?.e1rm ?? 0 };
	const e1rm = (w: number, r: number) => w * (1 + r / 30);

	let sets = $state<Record<string, SetRow[]>>(
		Object.fromEntries(
			todayWorkout.exercises.map((ex) => {
				const w = parseFloat(ex.suggestion.replace(/^2 × /, ''));
				const r = parseInt(ex.reps, 10);
				return [ex.id, Array.from({ length: ex.sets }, () => ({ weight: w, reps: r, done: false, pr: false }))];
			})
		)
	);
	let open = $state(todayWorkout.exercises[0]!.id);

	const total = $derived(Object.values(sets).reduce((s, rows) => s + rows.length, 0));
	const done = $derived(Object.values(sets).reduce((s, rows) => s + rows.filter((r) => r.done).length, 0));
	const volume = $derived(
		Object.values(sets).reduce((s, rows) => s + rows.filter((r) => r.done).reduce((a, r) => a + r.weight * r.reps, 0), 0)
	);

	// Rest timer
	const REST = 150;
	let restLeft = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;
	function startRest() {
		clearInterval(timer);
		restLeft = REST;
		timer = setInterval(() => {
			restLeft = Math.max(0, restLeft - 1);
			if (restLeft === 0) clearInterval(timer);
		}, 1000);
	}
	$effect(() => () => clearInterval(timer));

	let burst = $state<string | null>(null);

	function complete(exId: string, i: number) {
		const row = sets[exId]?.[i];
		if (!row) return;
		row.done = !row.done;
		if (!row.done) {
			row.pr = false;
			return;
		}
		const prev = best[exId];
		if (prev && e1rm(row.weight, row.reps) > prev) {
			row.pr = true;
			best[exId] = e1rm(row.weight, row.reps);
			burst = `${exId}-${i}`;
			setTimeout(() => (burst = null), 1400);
			toast(`New record: estimated 1RM ${best[exId]!.toFixed(1)} kg`);
		}
		startRest();
		const rows = sets[exId]!;
		if (rows.every((r) => r.done)) {
			const idx = todayWorkout.exercises.findIndex((e) => e.id === exId);
			const next = todayWorkout.exercises[idx + 1];
			if (next) setTimeout(() => (open = next.id), 450);
		}
	}

	function bump(row: SetRow, key: 'weight' | 'reps', d: number) {
		row[key] = Math.max(0, +(row[key] + d).toFixed(1));
	}

	const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	const particles = Array.from({ length: 14 }, (_, i) => i);
</script>

<PageHeader title={todayWorkout.name} sub="{todayWorkout.week}. Tap a set when it’s done; the rest timer starts on its own." />

<div class="progress">
	<div class="pmeta">
		<span class="num"><strong>{done}</strong> of {total} sets</span>
		<span class="num dim">{volume.toLocaleString('de-CH')} kg moved</span>
	</div>
	<Meter value={done} max={total} height={8} label="Sets completed" />
</div>

<ol class="exercises">
	{#each todayWorkout.exercises as ex, n (ex.id)}
		{@const rows = sets[ex.id]!}
		{@const finished = rows.every((r) => r.done)}
		<li class="ex" class:open={open === ex.id} class:finished>
			<button class="ex-head" onclick={() => (open = ex.id)} aria-expanded={open === ex.id}>
				<span class="badge num">{#if finished}<Icon name="check" size={16} stroke={2.5} />{:else}{n + 1}{/if}</span>
				<span class="grow">
					<span class="title">{ex.name}</span>
					<span class="meta">{ex.sets} × {ex.reps} at RIR {ex.rir} · last {ex.last}</span>
				</span>
				<span class="num dim small">{rows.filter((r) => r.done).length}/{rows.length}</span>
			</button>

			{#if open === ex.id}
				<div class="sets" in:fly={{ y: -6, duration: 220 }}>
					{#if ex.trimmed}
						<p class="note"><Icon name="moon" size={14} /> One set trimmed today because readiness is 72.</p>
					{/if}
					<div class="set-head dim small"><span>Set</span><span>kg</span><span>Reps</span><span></span></div>
					{#each rows as row, i (i)}
						<div class="set" class:done={row.done} class:pr={row.pr}>
							<span class="num setn">{i + 1}</span>
							<div class="stepper">
								<button onclick={() => bump(row, 'weight', -2.5)} aria-label="Less weight" disabled={row.done}>−</button>
								<input class="num" type="number" step="2.5" bind:value={row.weight} aria-label="Weight in kg, set {i + 1}" disabled={row.done} />
								<button onclick={() => bump(row, 'weight', 2.5)} aria-label="More weight" disabled={row.done}>+</button>
							</div>
							<div class="stepper">
								<button onclick={() => bump(row, 'reps', -1)} aria-label="Fewer reps" disabled={row.done}>−</button>
								<input class="num" type="number" bind:value={row.reps} aria-label="Reps, set {i + 1}" disabled={row.done} />
								<button onclick={() => bump(row, 'reps', 1)} aria-label="More reps" disabled={row.done}>+</button>
							</div>
							<button class="tick" onclick={() => complete(ex.id, i)} aria-pressed={row.done} aria-label={row.done ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}>
								<Icon name="check" size={18} stroke={2.5} />
							</button>
							{#if row.pr}
								<span class="prtag" in:scale={{ start: 0.4, duration: 420, easing: backOut }}>Record</span>
							{/if}
							{#if burst === `${ex.id}-${i}`}
								<span class="burst" aria-hidden="true">
									{#each particles as p (p)}<i style:--a="{(p / particles.length) * 360}deg" style:--d="{36 + (p % 3) * 14}px"></i>{/each}
								</span>
							{/if}
						</div>
					{/each}
					{#if ex.id === 'squat'}
						<p class="hint dim small">Hit 7 reps at 112.5 kg to beat your record of 135 kg.</p>
					{/if}
				</div>
			{/if}
		</li>
	{/each}
</ol>

{#if restLeft > 0}
	<div class="rest surface" transition:fly={{ y: 40, duration: 300 }} role="timer" aria-live="off">
		<Ring value={restLeft / REST} size={48} stroke={5} label="Rest time left">
			<Icon name="timer" size={16} />
		</Ring>
		<div>
			<p class="num big rt">{fmtTime(restLeft)}</p>
			<p class="dim small">Rest</p>
		</div>
		<button class="btn btn-sm" onclick={() => (restLeft = Math.min(REST * 2, restLeft + 30))}>+30 s</button>
		<button class="btn btn-ghost btn-sm" onclick={() => { restLeft = 0; clearInterval(timer); }}>Skip</button>
	</div>
{/if}

<style>
	.progress {
		margin-bottom: var(--s-6);
		max-width: 760px;
	}
	.pmeta {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--s-2);
		font-size: var(--t-sm);
	}
	.small {
		font-size: var(--t-xs);
	}
	.exercises {
		list-style: none;
		margin: 0;
		padding: 0;
		max-width: 760px;
		display: grid;
		gap: var(--s-2);
	}
	.ex {
		border-radius: var(--r-md);
		border: 1px solid transparent;
		transition:
			background var(--dur) var(--ease-out),
			border-color var(--dur) var(--ease-out);
	}
	.ex.open {
		background: color-mix(in oklab, var(--slate) 70%, transparent);
		border-color: var(--line);
	}
	.ex-head {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--s-3);
		padding: var(--s-3) var(--s-4);
		text-align: left;
	}
	.badge {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--slate-2);
		font-weight: 700;
		font-size: var(--t-sm);
		flex: none;
		transition:
			background var(--dur) var(--ease-out),
			color var(--dur) var(--ease-out);
	}
	.open .badge {
		background: var(--accent);
		color: var(--night-deep);
	}
	.finished .badge {
		background: color-mix(in oklab, var(--accent) 25%, transparent);
		color: var(--accent);
	}
	.grow {
		flex: 1;
		min-width: 0;
		display: grid;
	}
	.title {
		font-weight: 600;
	}
	.meta {
		font-size: var(--t-sm);
		color: var(--mist);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.finished .title {
		color: var(--mist);
	}
	.sets {
		padding: 0 var(--s-4) var(--s-4);
	}
	.note {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--t-sm);
		color: var(--accent);
		margin-bottom: var(--s-3);
	}
	.set-head,
	.set {
		display: grid;
		grid-template-columns: 36px 1fr 1fr 48px;
		gap: var(--s-3);
		align-items: center;
	}
	.set-head {
		padding: 0 0 var(--s-2);
	}
	.set {
		position: relative;
		height: 52px;
		padding: 0 0 0 0;
		border-radius: var(--r-sm);
		transition: background var(--dur) var(--ease-out);
	}
	.set.done {
		background: color-mix(in oklab, var(--accent) 12%, transparent);
	}
	.set.pr {
		background: color-mix(in oklab, var(--gold) 16%, transparent);
	}
	.setn {
		text-align: center;
		font-weight: 700;
		color: var(--mist);
	}
	.stepper {
		display: flex;
		align-items: center;
		height: 40px;
		border-radius: var(--r-sm);
		background: var(--night-deep);
		border: 1px solid var(--line);
		overflow: hidden;
	}
	.stepper button {
		width: 34px;
		height: 100%;
		color: var(--mist);
		font-size: 18px;
		flex: none;
	}
	.stepper button:hover:not(:disabled) {
		background: var(--slate-2);
		color: var(--paper);
	}
	.stepper button:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.stepper input {
		width: 100%;
		min-width: 0;
		text-align: center;
		background: none;
		border: 0;
		outline: none;
		font-weight: 700;
		font-size: var(--t-md);
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.stepper input::-webkit-inner-spin-button {
		display: none;
	}
	.tick {
		display: grid;
		place-items: center;
		width: 44px;
		height: 40px;
		border-radius: var(--r-sm);
		border: 1.5px solid var(--line-strong);
		color: var(--mist-dim);
		transition:
			background var(--dur-fast) var(--ease-out),
			transform var(--dur) var(--ease-spring),
			color var(--dur-fast);
	}
	.tick:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.tick[aria-pressed='true'] {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--night-deep);
		transform: scale(1.06);
	}
	.pr .tick[aria-pressed='true'] {
		background: var(--gold);
		border-color: var(--gold);
	}
	.prtag {
		position: absolute;
		right: 58px;
		top: -8px;
		padding: 2px 8px;
		border-radius: var(--r-pill);
		background: var(--gold);
		color: var(--night-deep);
		font-size: 11px;
		font-weight: 800;
	}
	.burst {
		position: absolute;
		right: 22px;
		top: 50%;
		pointer-events: none;
	}
	.burst i {
		position: absolute;
		width: 6px;
		height: 6px;
		border-radius: 2px;
		background: var(--gold);
		animation: fly 900ms var(--ease-out) forwards;
	}
	.burst i:nth-child(3n) {
		background: var(--ember);
	}
	.burst i:nth-child(4n) {
		background: var(--paper);
	}
	@keyframes fly {
		from {
			transform: rotate(var(--a)) translateX(0) scale(1);
			opacity: 1;
		}
		to {
			transform: rotate(var(--a)) translateX(var(--d)) scale(0.3);
			opacity: 0;
		}
	}
	.hint {
		margin-top: var(--s-3);
	}
	.rest {
		position: fixed;
		z-index: 20;
		left: 50%;
		bottom: 28px;
		translate: -50% 0;
		display: flex;
		align-items: center;
		gap: var(--s-4);
		padding: var(--s-3) var(--s-4);
		border-radius: var(--r-pill);
	}
	.rt {
		font-size: var(--t-xl);
	}
	@media (max-width: 760px) {
		.rest {
			bottom: calc(84px + env(safe-area-inset-bottom));
		}
		.set-head,
		.set {
			grid-template-columns: 24px 1fr 1fr 44px;
			gap: var(--s-2);
		}
		.stepper button {
			width: 28px;
		}
	}
</style>
