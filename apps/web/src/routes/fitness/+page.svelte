<script lang="ts">
	import { resolve } from '$app/paths';
	import { AnimatedNumber, Icon, LabelBadge, Ring } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { macros, prs, readiness, todayWorkout, weekSessions } from '$lib/data/fitness';
	import { fmtShort, minutes } from '$lib/format';

	const macroRows = [
		{ key: 'protein', name: 'Protein', unit: 'g', ...macros.protein },
		{ key: 'carbs', name: 'Carbs', unit: 'g', ...macros.carbs },
		{ key: 'fat', name: 'Fat', unit: 'g', ...macros.fat }
	];
	const totalSets = todayWorkout.exercises.reduce((s, e) => s + e.sets, 0);
</script>

<PageHeader title="Today" sub="Training, food and recovery, adjusted to how you slept.">
	{#snippet actions()}
		<a class="btn btn-primary" href={resolve('/fitness/workout')}><Icon name="play" size={16} /> Start Lower A</a>
	{/snippet}
</PageHeader>

<div class="split">
	<div>
		<section class="readiness">
			<Ring value={readiness.score / 100} size={168} stroke={12} label="Readiness {readiness.score} of 100">
				<div>
					<p class="big score num">{readiness.score}</p>
					<p class="dim small">readiness</p>
				</div>
			</Ring>
			<div class="rd">
				<h2 class="section-title">Slightly under baseline</h2>
				<p class="muted">{readiness.note}</p>
				<dl>
					<div><dt class="dim">Sleep</dt><dd class="num">{minutes(readiness.sleepMin)}</dd></div>
					<div><dt class="dim">HRV</dt><dd class="num">{readiness.hrvMs} ms <span class="dim">/ {readiness.hrvBaseline}</span></dd></div>
					<div><dt class="dim">Resting HR</dt><dd class="num">{readiness.restingHr} bpm</dd></div>
				</dl>
				<p class="src dim"><LabelBadge label="private" /> From Apple Health, scored on this device</p>
			</div>
		</section>

		<section class="block">
			<div class="block-head">
				<h2 class="section-title">{todayWorkout.name} at {todayWorkout.start}</h2>
				<span class="dim">{todayWorkout.week}</span>
			</div>
			<ul class="rows plan">
				{#each todayWorkout.exercises as ex, i (ex.id)}
					<li class="row">
						<span class="idx num dim">{i + 1}</span>
						<div class="grow">
							<p class="title">{ex.name}</p>
							<p class="meta">Last time {ex.last}</p>
						</div>
						<div class="target">
							<p class="num"><strong>{ex.sets}</strong> × {ex.reps}</p>
							<p class="meta num">{ex.suggestion} · RIR {ex.rir}</p>
						</div>
						{#if ex.trimmed}<span class="chip trimmed" title="One set removed for readiness">−1 set</span>{/if}
					</li>
				{/each}
			</ul>
			<p class="foot dim">{totalSets} working sets · about {todayWorkout.estimateMin} min</p>
		</section>
	</div>

	<aside>
		<section>
			<div class="block-head">
				<h2 class="section-title">Food today</h2>
				<a href={resolve('/fitness/nutrition')}>Log a meal</a>
			</div>
			<p class="kcal"><span class="big num"><AnimatedNumber value={macros.kcal.eaten} /></span> <span class="dim">/ {macros.kcal.target.toLocaleString('de-CH')} kcal</span></p>
			<div class="macros">
				{#each macroRows as m (m.key)}
					<div class="macro">
						<Ring value={m.eaten / m.target} size={74} stroke={7} label="{m.name} {m.eaten} of {m.target} {m.unit}">
							<span class="num mval">{m.eaten}</span>
						</Ring>
						<p>{m.name}</p>
						<p class="dim num small">of {m.target} {m.unit}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="block">
			<h2 class="section-title">This week</h2>
			<ol class="days">
				{#each weekSessions as d (d.day)}
					<li class:done={d.done && d.name !== 'Rest'} class:rest={d.name === 'Rest'} class:today={d.day === 'Wed'}>
						<span class="d">{d.day}</span>
						<span class="n">{d.name === 'Rest' ? '·' : d.name.split(' ')[1]}</span>
					</li>
				{/each}
			</ol>
		</section>

		<section class="block">
			<div class="block-head">
				<h2 class="section-title">Recent records</h2>
				<a href={resolve('/fitness/progress')}>All progress</a>
			</div>
			<ul class="rows">
				{#each prs.slice(0, 3) as p (p.lift)}
					<li class="row">
						<div class="grow">
							<p class="title">{p.lift}</p>
							<p class="meta">{fmtShort(p.date)}</p>
						</div>
						<p class="amount num">{p.e1rm} kg</p>
						{#if p.delta > 0}<span class="chip up num">+{p.delta}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>

<style>
	.readiness {
		display: flex;
		gap: var(--s-6);
		align-items: center;
		padding-bottom: var(--s-6);
		border-bottom: 1px solid var(--line);
	}
	.score {
		font-size: 3.4rem;
	}
	.small {
		font-size: var(--t-xs);
	}
	.rd .muted {
		margin-top: var(--s-2);
		max-width: 52ch;
	}
	dl {
		display: flex;
		gap: var(--s-6);
		margin: var(--s-4) 0 0;
	}
	dt {
		font-size: var(--t-xs);
	}
	dd {
		margin: 2px 0 0;
		font-weight: 600;
	}
	.src {
		margin-top: var(--s-4);
		font-size: var(--t-xs);
		display: flex;
		gap: var(--s-2);
		align-items: center;
	}
	.plan {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.idx {
		width: 20px;
		font-size: var(--t-sm);
	}
	.target {
		text-align: right;
	}
	.trimmed {
		background: color-mix(in oklab, var(--accent) 16%, transparent);
		color: var(--accent);
	}
	.foot {
		margin-top: var(--s-3);
		font-size: var(--t-sm);
	}
	.kcal {
		margin-bottom: var(--s-4);
	}
	.kcal .big {
		font-size: 2.6rem;
	}
	.macros {
		display: flex;
		gap: var(--s-5);
	}
	.macro {
		text-align: center;
	}
	.macro p:first-of-type {
		margin-top: var(--s-2);
		font-weight: 600;
		font-size: var(--t-sm);
	}
	.mval {
		font-weight: 700;
	}
	.days {
		list-style: none;
		margin: var(--s-4) 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 6px;
	}
	.days li {
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: var(--s-2) 0;
		border-radius: var(--r-sm);
		background: var(--slate);
		font-size: var(--t-xs);
	}
	.days .d {
		color: var(--mist-dim);
	}
	.days .n {
		font-weight: 700;
		height: 18px;
	}
	.days .rest {
		background: transparent;
		border: 1px dashed var(--line);
	}
	.days .done {
		background: color-mix(in oklab, var(--accent) 22%, var(--slate));
		color: var(--paper);
	}
	.days .today {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.up {
		background: color-mix(in oklab, var(--good) 16%, transparent);
		color: var(--good);
	}
	@media (max-width: 640px) {
		.readiness {
			flex-direction: column;
			align-items: flex-start;
		}
		dl {
			gap: var(--s-4);
		}
	}
</style>
