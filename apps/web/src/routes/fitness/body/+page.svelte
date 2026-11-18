<script lang="ts">
	import { Icon, LabelBadge } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { measurements, photoSessions } from '$lib/data/fitness';
	import { fmtShort } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	let compare = $state(50);
</script>

<PageHeader title="Body" sub="Progress photos are sealed: they’re encrypted on your phone and never shown on the web or to any AI." />

<section class="sealed">
	<div class="frames">
		{#each photoSessions as s, i (s.date)}
			<figure style:--i={i}>
				<div class="frame" aria-hidden="true">
					<svg viewBox="0 0 80 120"><path d="M40 14a10 10 0 110 20 10 10 0 010-20zM26 40h28l6 34-8 2-3 38H31l-3-38-8-2z" /></svg>
					<span class="lock"><Icon name="lock" size={16} /></span>
				</div>
				<figcaption class="num">{fmtShort(s.date)}</figcaption>
			</figure>
		{/each}
	</div>
	<div class="explain">
		<LabelBadge label="sealed" />
		<h2 class="section-title">Open them on your phone</h2>
		<p class="muted">Photos live only on your own devices, end-to-end encrypted. Your server stores ciphertext it can’t read. Comparing poses happens on the phone with Apple Vision.</p>
		<button class="btn" onclick={() => toast('Sent a link to thraccer on your phone.')}><Icon name="phone" size={16} /> Open thraccer on iPhone</button>
	</div>
</section>

<div class="split block">
	<section>
		<h2 class="section-title">Ghost camera</h2>
		<p class="muted lead">The camera overlays your last photo so every shot lines up: same distance, same pose, same light. Drag to see how it works.</p>
		<div class="ghost" style:--c="{compare}%">
			<div class="g g-old" aria-hidden="true"><svg viewBox="0 0 80 120"><path d="M40 14a10 10 0 110 20 10 10 0 010-20zM24 40h32l7 34-9 2-3 38H29l-3-38-9-2z" /></svg></div>
			<div class="g g-new" aria-hidden="true"><svg viewBox="0 0 80 120"><path d="M40 14a10 10 0 110 20 10 10 0 010-20zM26 40h28l6 34-8 2-3 38H31l-3-38-8-2z" /></svg></div>
			<span class="handle" aria-hidden="true"></span>
			<input type="range" min="0" max="100" bind:value={compare} aria-label="Compare overlay position" />
		</div>
		<p class="dim small">Illustration only. Real photos never appear here.</p>
	</section>

	<section>
		<h2 class="section-title">Measurements</h2>
		<ul class="rows list">
			{#each measurements as m (m.name)}
				<li class="row">
					<p class="grow title">{m.name}</p>
					<p class="num">{m.value}</p>
					<span class="chip num">{m.change} <span class="dim">{m.since}</span></span>
				</li>
			{/each}
		</ul>
		<p class="dim small src"><LabelBadge label="private" compact /> Measurements are private: your devices and server only.</p>
	</section>
</div>

<style>
	.small {
		font-size: var(--t-xs);
	}
	.sealed {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: var(--s-6);
		align-items: center;
		padding-bottom: var(--s-6);
		border-bottom: 1px solid var(--line);
	}
	.frames {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--s-3);
	}
	figure {
		margin: 0;
		animation: lift 700ms var(--ease-spring) both;
		animation-delay: calc(var(--i) * 70ms);
	}
	@keyframes lift {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
	}
	.frame {
		position: relative;
		aspect-ratio: 3 / 4;
		border-radius: var(--r-md);
		overflow: hidden;
		background: linear-gradient(160deg, color-mix(in oklab, var(--accent) 22%, var(--slate)), var(--night-deep));
		border: 1px solid var(--line);
		display: grid;
		place-items: center;
	}
	.frame svg {
		width: 60%;
		fill: color-mix(in oklab, var(--paper) 20%, transparent);
		filter: blur(7px);
	}
	.lock {
		position: absolute;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: rgb(10 14 26 / 0.7);
		color: var(--label-sealed);
		backdrop-filter: blur(6px);
	}
	figcaption {
		margin-top: 6px;
		font-size: var(--t-xs);
		color: var(--mist);
		text-align: center;
	}
	.explain {
		display: grid;
		gap: var(--s-3);
		justify-items: start;
	}
	.lead {
		margin: var(--s-2) 0 var(--s-4);
		max-width: 52ch;
	}
	.ghost {
		position: relative;
		height: 280px;
		border-radius: var(--r-lg);
		overflow: hidden;
		background: radial-gradient(circle at 50% 30%, var(--slate-2), var(--night-deep));
		border: 1px solid var(--line);
		margin-bottom: var(--s-2);
	}
	.g {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}
	.g svg {
		height: 86%;
	}
	.g-old svg {
		fill: none;
		stroke: var(--mist);
		stroke-dasharray: 4 4;
		stroke-width: 0.8;
	}
	.g-new {
		clip-path: inset(0 0 0 var(--c));
	}
	.g-new svg {
		fill: color-mix(in oklab, var(--accent) 45%, transparent);
	}
	.handle {
		position: absolute;
		top: 0;
		bottom: 0;
		left: var(--c);
		width: 2px;
		background: var(--accent);
		box-shadow: 0 0 12px var(--accent);
	}
	.ghost input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: ew-resize;
	}
	.ghost:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.list {
		list-style: none;
		margin: var(--s-3) 0 0;
		padding: 0;
	}
	.src {
		margin-top: var(--s-3);
		display: flex;
		gap: 6px;
		align-items: center;
	}
	@media (max-width: 900px) {
		.sealed {
			grid-template-columns: 1fr;
		}
	}
</style>
