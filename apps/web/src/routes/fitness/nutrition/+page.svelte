<script lang="ts">
	import { AnimatedNumber, Icon, Meter, LabelBadge } from '@heroics/ui';
	import { fly } from 'svelte/transition';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { macros, meals as seedMeals } from '$lib/data/fitness';
	import { toast } from '$lib/state.svelte';

	let meals = $state([...seedMeals]);
	let kcal = $state(macros.kcal.eaten);
	let protein = $state(macros.protein.eaten);

	const quick = [
		{ name: 'Skyr 500 g', kcal: 315, protein: 55 },
		{ name: 'Protein shake', kcal: 180, protein: 32 },
		{ name: 'Chicken breast 200 g', kcal: 330, protein: 62 }
	];

	function add(q: (typeof quick)[number]) {
		meals = [...meals, { meal: 'Snack', time: '16:40', items: q.name, kcal: q.kcal, protein: q.protein }];
		kcal += q.kcal;
		protein += q.protein;
		toast(`Logged ${q.name}`);
	}
</script>

<PageHeader title="Nutrition" sub="Targets adapt every week from your real intake and weight trend, not from a formula.">
	{#snippet actions()}
		<button class="btn" onclick={() => toast('Barcode scanning runs on your phone with the camera.')}><Icon name="qr" size={16} /> Scan barcode</button>
		<button class="btn" onclick={() => toast('Label scans are read on your phone and never uploaded.')}><Icon name="camera" size={16} /> Scan label</button>
	{/snippet}
</PageHeader>

<div class="split">
	<section>
		<div class="totals">
			<div>
				<p class="big kc num"><AnimatedNumber value={kcal} /></p>
				<p class="muted">of {macros.kcal.target.toLocaleString('de-CH')} kcal</p>
			</div>
			<div>
				<p class="big kc num"><AnimatedNumber value={protein} /><span class="u">g</span></p>
				<p class="muted">protein of {macros.protein.target} g</p>
			</div>
		</div>
		<div class="meters">
			<Meter value={kcal} max={macros.kcal.target} height={10} label="Calories" />
			<Meter value={protein} max={macros.protein.target} height={10} color="var(--gold)" label="Protein" />
		</div>

		<div class="block">
			<h2 class="section-title">Logged today</h2>
			<ul class="rows list">
				{#each meals as m, i (i)}
					<li class="row" in:fly={{ y: 8, duration: 260 }}>
						<span class="t num dim">{m.time}</span>
						<div class="grow">
							<p class="title">{m.items}</p>
							<p class="meta">{m.meal}</p>
						</div>
						<p class="num">{m.kcal} kcal</p>
						<span class="chip num">{m.protein} g</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<aside>
		<section class="adaptive">
			<h2 class="section-title">Your real expenditure</h2>
			<p class="big num exp">2’840 <span class="u">kcal</span></p>
			<p class="muted">Estimated from 21 days of intake and trend weight. You’re losing 0.25 kg a week, right on your goal, so this week’s target stays at 2’650 kcal.</p>
			<p class="src dim"><LabelBadge label="private" compact /> Calculated on this device</p>
		</section>

		<section class="block">
			<h2 class="section-title">Close the protein gap</h2>
			<p class="muted small">{Math.max(0, macros.protein.target - protein)} g to go. One tap logs it.</p>
			<div class="quick">
				{#each quick as q (q.name)}
					<button class="q" onclick={() => add(q)}>
						<span class="title">{q.name}</span>
						<span class="dim num">{q.protein} g · {q.kcal} kcal</span>
						<Icon name="plus" size={16} />
					</button>
				{/each}
			</div>
		</section>
	</aside>
</div>

<style>
	.small {
		font-size: var(--t-sm);
	}
	.totals {
		display: flex;
		gap: var(--s-7);
		margin-bottom: var(--s-4);
	}
	.kc {
		font-size: clamp(2.6rem, 2rem + 2vw, 3.6rem);
	}
	.u {
		font-size: var(--t-lg);
		margin-left: 4px;
		color: var(--mist);
		letter-spacing: 0;
	}
	.meters {
		display: grid;
		gap: var(--s-3);
		max-width: 560px;
	}
	.list {
		list-style: none;
		margin: var(--s-3) 0 0;
		padding: 0;
	}
	.t {
		width: 44px;
		font-size: var(--t-sm);
	}
	.adaptive {
		padding: var(--s-5);
		border-radius: var(--r-lg);
		background: linear-gradient(150deg, color-mix(in oklab, var(--accent) 14%, var(--slate)), color-mix(in oklab, var(--slate) 60%, transparent));
		border: 1px solid var(--accent-line);
	}
	.exp {
		font-size: 2.6rem;
		margin: var(--s-3) 0 var(--s-2);
	}
	.src {
		margin-top: var(--s-3);
		font-size: var(--t-xs);
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.quick {
		display: grid;
		gap: var(--s-2);
		margin-top: var(--s-3);
	}
	.q {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: var(--s-3);
		align-items: center;
		height: 48px;
		padding: 0 var(--s-4);
		border-radius: var(--r-sm);
		background: var(--slate);
		text-align: left;
		font-size: var(--t-sm);
		transition: background var(--dur-fast), transform var(--dur-fast);
	}
	.q:hover {
		background: var(--slate-2);
	}
	.q:active {
		transform: scale(0.98);
	}
	.q :global(svg) {
		color: var(--accent);
	}
</style>
