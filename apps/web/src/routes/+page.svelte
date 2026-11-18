<script lang="ts">
	import { resolve } from '$app/paths';
	import { AnimatedNumber, Icon, LabelBadge, Ring, Sparkline, TierBadge } from '@heroics/ui';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { APPS } from '$lib/apps';
	import { chf, fmtWeekday, fmtShort, TODAY } from '$lib/format';
	import { readiness, weight, weekSessions } from '$lib/data/fitness';
	import { budgets, month, netWorth } from '$lib/data/finance';
	import { board, projects } from '$lib/data/projects';
	import { ledger } from '$lib/data/agent';
	import { queue, shell } from '$lib/state.svelte';

	const hour = new Date().getHours();
	const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

	const budgetLeft = budgets.reduce((s, b) => s + (b.limit - b.spent), 0);
	const openToday = board.filter((c) => c.status === 'doing' || c.status === 'review').length;
	const atRisk = projects.filter((p) => p.risk).length;
	const sessionsDone = weekSessions.filter((s) => s.done && s.name !== 'Rest').length;
	const sessionsPlanned = weekSessions.filter((s) => s.name !== 'Rest').length;
	const cloudRuns = ledger.filter((l) => l.tier === 'cloud').length;
	const blocked = ledger.filter((l) => l.outcome === 'blocked').length;
	const localRuns = 211;

	const hue = (id: string) => APPS.find((a) => a.id === id)?.hue ?? 'var(--gold)';

	const timeline = [
		{ time: '07:41', title: 'Breakfast logged from a label scan', app: 'fitness', done: true },
		{ time: '09:00', title: 'Bills and inbox', app: 'finance', done: true },
		{ time: '10:30', title: 'Design tokens · deep work', app: 'projects', done: true, note: 'Moved from 8:00 after short sleep' },
		{ time: '14:00', title: 'Alpine Dental client review', app: 'projects', done: true },
		{ time: '18:00', title: 'Lower A · 64 min', app: 'fitness', done: false, next: true, note: 'One set trimmed for readiness' },
		{ time: '20:00', title: 'Log dinner · 48 g protein to go', app: 'fitness', done: false }
	];
</script>

<section class="hero">
	<p class="date muted">{fmtWeekday(TODAY)}, {fmtShort(TODAY)}</p>
	<h1>{greeting}.</h1>
	<p class="lede muted">
		Leg day at six, budget on track, and {queue.items.length
			? `${queue.items.length} ${queue.items.length === 1 ? 'thing needs' : 'things need'} your yes or no.`
			: 'nothing waiting on you.'}
	</p>
</section>

<section class="vitals" aria-label="Your day at a glance">
	<a class="vital" href={resolve('/fitness')} style:--hue={hue('fitness')}>
		<p class="vlabel"><span class="hue-dot"></span>Body</p>
		<div class="vrow">
			<Ring value={readiness.score / 100} size={92} stroke={8} color="var(--hue)" label="Readiness {readiness.score} of 100">
				<span class="ring-num num">{readiness.score}</span>
			</Ring>
			<div>
				<p class="vbig">Readiness</p>
				<p class="vsub muted">HRV {readiness.hrvMs} ms, slightly low</p>
				<p class="vsub muted num">Trend {weight.at(-1)?.y.toFixed(1)} kg</p>
			</div>
		</div>
	</a>
	<a class="vital" href={resolve('/finance')} style:--hue={hue('finance')}>
		<p class="vlabel"><span class="hue-dot"></span>Money</p>
		<p class="big vnum"><AnimatedNumber value={budgetLeft / 100} format={(n) => chf(n * 100, { whole: true })} /></p>
		<p class="vsub muted">left in {month.name} budgets, {month.daysInMonth - month.dayOfMonth} days to go</p>
		<Sparkline values={netWorth} width={220} height={34} color="var(--hue)" label="Net worth trend, rising" />
	</a>
	<a class="vital" href={resolve('/projects')} style:--hue={hue('projects')}>
		<p class="vlabel"><span class="hue-dot"></span>Work</p>
		<p class="big vnum"><AnimatedNumber value={openToday} /></p>
		<p class="vsub muted">tasks in progress or waiting for review</p>
		{#if atRisk}
			<p class="risk"><Icon name="alert" size={14} /> {atRisk} milestone at risk</p>
		{/if}
	</a>
</section>

<div class="split">
	<section class="block" aria-labelledby="needs">
		<div class="block-head">
			<h2 id="needs" class="section-title">Needs you</h2>
			<button class="link" onclick={() => (shell.agentOpen = true)}>Open assistant</button>
		</div>
		{#if queue.items.length}
			<ul class="needs rows">
				{#each queue.items as a (a.id)}
					<li class="need" style:--hue={hue(a.app)} animate:flip={{ duration: 280 }} out:slide={{ duration: 200 }}>
						<span class="hue-dot"></span>
						<div class="grow">
							<p class="title">{a.title}</p>
							<p class="meta">{a.detail}</p>
							<p class="badges"><TierBadge tier={a.tier} /><LabelBadge label={a.label} /></p>
						</div>
						<div class="need-actions">
							<button class="btn btn-sm" onclick={() => queue.resolve(a.id, true)} aria-label="Approve: {a.title}"><Icon name="check" size={15} /> Approve</button>
							<button class="icon-btn" onclick={() => queue.resolve(a.id, false)} aria-label="Decline: {a.title}"><Icon name="x" size={16} /></button>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="caught muted"><Icon name="check" size={18} /> All caught up. Proposals land here before anything changes.</p>
		{/if}

		<div class="block-gap">
			<div class="block-head">
				<h2 class="section-title">This week</h2>
			</div>
			<div class="week">
				<div class="wk" style:--hue={hue('fitness')}>
					<Ring value={sessionsDone / sessionsPlanned} size={64} stroke={6} color="var(--hue)" label="{sessionsDone} of {sessionsPlanned} sessions">
						<span class="num wk-num">{sessionsDone}/{sessionsPlanned}</span>
					</Ring>
					<p>Training sessions</p>
				</div>
				<div class="wk" style:--hue={hue('finance')}>
					<Ring value={month.spent / month.income} size={64} stroke={6} color="var(--hue)" label="{Math.round((month.spent / month.income) * 100)} percent of income spent">
						<span class="num wk-num">{Math.round((month.spent / month.income) * 100)}%</span>
					</Ring>
					<p>Of income spent</p>
				</div>
				<div class="wk" style:--hue={hue('projects')}>
					<Ring value={4 / 13} size={64} stroke={6} color="var(--hue)" label="4 of 13 Heroics tasks done">
						<span class="num wk-num">4/13</span>
					</Ring>
					<p>Heroics tasks done</p>
				</div>
			</div>
		</div>
	</section>

	<section class="block" aria-labelledby="today">
		<div class="block-head">
			<h2 id="today" class="section-title">Today</h2>
			<span class="dim num">now 16:40</span>
		</div>
		<ol class="timeline">
			{#each timeline as t (t.time)}
				<li class:done={t.done} class:next={t.next} style:--hue={hue(t.app)}>
					<span class="t num">{t.time}</span>
					<span class="node" aria-hidden="true"></span>
					<div>
						<p class="tt">{t.title}</p>
						{#if t.note}<p class="tn dim">{t.note}</p>{/if}
					</div>
				</li>
			{/each}
		</ol>

		<a class="privacy" href={resolve('/ledger')}>
			<Icon name="shield" size={20} />
			<p>
				<strong class="num">{localRuns}</strong> AI runs stayed on your devices or server this week.
				<strong class="num">{cloudRuns}</strong> used cloud AI under your grants, and <strong class="num">{blocked}</strong> unsafe request was stopped.
			</p>
			<Icon name="chevronRight" size={18} />
		</a>
	</section>
</div>

<style>
	.hero {
		margin-bottom: var(--s-7);
	}
	.date {
		font-size: var(--t-sm);
		font-weight: 600;
	}
	h1 {
		font-size: clamp(2.6rem, 1.6rem + 4vw, 4.75rem);
		font-weight: 650;
		letter-spacing: -0.045em;
		margin-top: var(--s-2);
		background: linear-gradient(100deg, var(--paper) 30%, color-mix(in oklab, var(--gold) 70%, var(--paper)));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.lede {
		margin-top: var(--s-3);
		font-size: var(--t-lg);
		max-width: 56ch;
	}

	.vitals {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		margin-bottom: var(--s-7);
	}
	.vital {
		position: relative;
		padding: var(--s-5) var(--s-5) var(--s-5) 0;
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		transition: background var(--dur) var(--ease-out);
	}
	.vital + .vital {
		padding-left: var(--s-5);
		border-left: 1px solid var(--line);
	}
	.vital::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 2px;
		background: var(--hue);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform var(--dur-slow) var(--ease-spring);
		box-shadow: 0 0 14px var(--hue);
	}
	.vital:hover::after,
	.vital:focus-visible::after {
		transform: scaleX(1);
	}
	.vlabel {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		font-weight: 600;
		color: var(--mist);
		font-size: var(--t-sm);
	}
	.vrow {
		display: flex;
		align-items: center;
		gap: var(--s-4);
	}
	.ring-num {
		font-family: var(--font-display);
		font-size: var(--t-2xl);
		font-weight: 650;
	}
	.vbig {
		font-family: var(--font-display);
		font-size: var(--t-xl);
		font-weight: 600;
	}
	.vnum {
		font-size: clamp(2.2rem, 1.6rem + 2vw, 3.25rem);
		color: var(--paper);
	}
	.vsub {
		font-size: var(--t-sm);
	}
	.risk {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: var(--t-sm);
		font-weight: 600;
		color: var(--warn);
	}

	.needs {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.need {
		display: flex;
		align-items: flex-start;
		gap: var(--s-3);
		padding: var(--s-4) 0;
	}
	.need .hue-dot {
		margin-top: 8px;
	}
	.need .grow {
		flex: 1;
		min-width: 0;
	}
	.need .title {
		font-weight: 600;
	}
	.need .meta {
		font-size: var(--t-sm);
		color: var(--mist);
	}
	.badges {
		display: flex;
		gap: 6px;
		margin-top: var(--s-2);
	}
	.need-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.caught {
		display: flex;
		align-items: center;
		gap: var(--s-2);
	}
	.caught :global(svg) {
		color: var(--good);
	}

	.week {
		display: flex;
		gap: var(--s-6);
		flex-wrap: wrap;
	}
	.wk {
		display: flex;
		align-items: center;
		gap: var(--s-3);
	}
	.wk p {
		font-size: var(--t-sm);
		color: var(--mist);
		max-width: 10ch;
		line-height: 1.3;
	}
	.wk-num {
		font-size: 13px;
		font-weight: 700;
	}

	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		position: relative;
	}
	.timeline li {
		display: grid;
		grid-template-columns: 48px 18px 1fr;
		gap: var(--s-3);
		align-items: start;
		padding-bottom: var(--s-4);
		position: relative;
	}
	.timeline li:not(:last-child)::before {
		content: '';
		position: absolute;
		left: calc(48px + 12px + 8px);
		top: 18px;
		bottom: 0;
		width: 2px;
		background: var(--line);
	}
	.t {
		font-size: var(--t-sm);
		color: var(--mist-dim);
		padding-top: 1px;
	}
	.node {
		width: 12px;
		height: 12px;
		margin: 5px 0 0 3px;
		border-radius: 50%;
		border: 2px solid var(--hue);
		background: var(--night);
		position: relative;
		z-index: 1;
	}
	.done .node {
		background: var(--hue);
		opacity: 0.55;
	}
	.done .tt {
		color: var(--mist);
	}
	.next .node {
		box-shadow: 0 0 0 4px color-mix(in oklab, var(--hue) 25%, transparent), 0 0 16px var(--hue);
		animation: pulse 2.4s var(--ease-out) infinite;
	}
	@keyframes pulse {
		50% {
			box-shadow: 0 0 0 7px color-mix(in oklab, var(--hue) 10%, transparent), 0 0 20px var(--hue);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.next .node {
			animation: none;
		}
	}
	.next .tt {
		font-weight: 700;
	}
	.tt {
		font-weight: 500;
	}
	.tn {
		font-size: var(--t-xs);
		margin-top: 2px;
	}

	.privacy {
		margin-top: var(--s-5);
		display: flex;
		align-items: center;
		gap: var(--s-3);
		padding: var(--s-4);
		border-radius: var(--r-md);
		border: 1px dashed var(--line-strong);
		color: var(--mist);
		font-size: var(--t-sm);
		transition:
			border-color var(--dur) var(--ease-out),
			background var(--dur) var(--ease-out);
	}
	.privacy:hover {
		border-color: var(--gold);
		background: color-mix(in oklab, var(--gold) 6%, transparent);
	}
	.privacy strong {
		color: var(--paper);
	}
	.privacy > :global(svg:first-child) {
		color: var(--gold);
	}

	@media (max-width: 900px) {
		.vitals {
			grid-template-columns: 1fr;
		}
		.vital,
		.vital + .vital {
			padding: var(--s-4) 0;
			border-left: 0;
		}
		.vital + .vital {
			border-top: 1px solid var(--line);
		}
	}
</style>
