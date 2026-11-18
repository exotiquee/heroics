<script lang="ts">
	import { LineChart } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { prs, volume, weight } from '$lib/data/fitness';
	import { fmtShort } from '$lib/format';

	let range = $state<30 | 60 | 90>(90);
	const points = $derived(weight.slice(-range));
	const first = $derived(points[0]!.y);
	const last = $derived(points.at(-1)!.y);
	const weekly = $derived(((last - first) / (range / 7)).toFixed(2));
	const maxSets = Math.max(...volume.map((v) => v.max)) + 2;
</script>

<PageHeader title="Progress" sub="Trend weight smooths out daily water swings. Volume shows where this week lands against your target range." />

<section>
	<div class="block-head">
		<div>
			<h2 class="section-title">Trend weight</h2>
			<p class="muted small num">{last.toFixed(1)} kg · {Number(weekly) <= 0 ? '' : '+'}{weekly} kg per week over {range} days</p>
		</div>
		<div class="seg" role="radiogroup" aria-label="Range">
			{#each [30, 60, 90] as const as r (r)}
				<button role="radio" aria-checked={range === r} class:on={range === r} onclick={() => (range = r)}>{r} d</button>
			{/each}
		</div>
	</div>
	{#key range}
		<LineChart {points} height={240} format={(n) => `${n.toFixed(1)} kg`} xFormat={fmtShort} label="Trend weight over {range} days, from {first.toFixed(1)} to {last.toFixed(1)} kilograms" />
	{/key}
	<p class="legend dim small"><span class="dot"></span> Daily weigh-ins <span class="line"></span> Trend</p>
</section>

<div class="split block">
	<section>
		<div class="block-head">
			<h2 class="section-title">Weekly sets per muscle</h2>
			<span class="dim small">Shaded band = your target range</span>
		</div>
		<ul class="vol">
			{#each volume as v (v.muscle)}
				{@const under = v.sets < v.min}
				<li>
					<span class="m">{v.muscle}</span>
					<div class="track" role="img" aria-label="{v.muscle}: {v.sets} sets, target {v.min} to {v.max}">
						<span class="band" style:left="{(v.min / maxSets) * 100}%" style:width="{((v.max - v.min) / maxSets) * 100}%"></span>
						<span class="bar" class:under style:width="{(v.sets / maxSets) * 100}%"></span>
					</div>
					<span class="num s" class:under>{v.sets}</span>
				</li>
			{/each}
		</ul>
		<p class="dim small note">Quads and calves are under range. Friday’s Upper B swaps two lateral raise sets for calf raises if you approve.</p>
	</section>

	<section>
		<h2 class="section-title">Estimated 1-rep max</h2>
		<ul class="rows prs">
			{#each prs as p (p.lift)}
				<li class="row">
					<div class="grow">
						<p class="title">{p.lift}</p>
						<p class="meta">Set on {fmtShort(p.date)}</p>
					</div>
					<p class="big pr num">{p.e1rm}<span class="dim u">kg</span></p>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.small {
		font-size: var(--t-xs);
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
		transition: background var(--dur-fast), color var(--dur-fast);
	}
	.seg button.on {
		background: var(--accent);
		color: var(--night-deep);
	}
	.legend {
		margin-top: var(--s-3);
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.legend .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--mist-dim);
	}
	.legend .line {
		width: 16px;
		height: 3px;
		border-radius: 2px;
		background: var(--accent);
		margin-left: 10px;
	}
	.vol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.vol li {
		display: grid;
		grid-template-columns: 96px 1fr 28px;
		gap: var(--s-3);
		align-items: center;
		font-size: var(--t-sm);
	}
	.track {
		position: relative;
		height: 14px;
		border-radius: var(--r-pill);
		background: var(--slate);
	}
	.band {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: var(--r-pill);
		background: color-mix(in oklab, var(--paper) 10%, transparent);
		outline: 1px dashed var(--line-strong);
	}
	.bar {
		position: absolute;
		left: 0;
		top: 3px;
		bottom: 3px;
		border-radius: var(--r-pill);
		background: var(--accent);
		box-shadow: 0 0 10px color-mix(in oklab, var(--accent) 50%, transparent);
		transform-origin: left;
		animation: grow 900ms var(--ease-spring) both;
	}
	.bar.under {
		background: var(--warn);
		box-shadow: none;
	}
	@keyframes grow {
		from {
			transform: scaleX(0);
		}
	}
	.s {
		font-weight: 700;
		text-align: right;
	}
	.s.under {
		color: var(--warn);
	}
	.note {
		margin-top: var(--s-4);
		max-width: 56ch;
	}
	.prs {
		list-style: none;
		margin: var(--s-3) 0 0;
		padding: 0;
	}
	.pr {
		font-size: var(--t-2xl);
	}
	.u {
		font-size: var(--t-sm);
		margin-left: 4px;
		letter-spacing: 0;
	}
</style>
