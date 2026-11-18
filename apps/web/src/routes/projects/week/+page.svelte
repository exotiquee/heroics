<script lang="ts">
	import { Icon } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { week, type Block } from '$lib/data/projects';

	const days = ['Mon 16', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20', 'Sat 21', 'Sun 22'];
	const TODAY_IDX = 2;
	const START = 7;
	const END = 21;
	const HOUR = 52;
	const NOW = 16 + 40 / 60;
	const hours = Array.from({ length: END - START + 1 }, (_, i) => START + i);

	const kindStyle: Record<Block['kind'], { hue: string; name: string }> = {
		deep: { hue: 'var(--iris)', name: 'Deep work' },
		meeting: { hue: '#6fb6ff', name: 'Meeting' },
		training: { hue: 'var(--ember)', name: 'Training' },
		admin: { hue: 'var(--jade)', name: 'Admin' },
		personal: { hue: 'var(--gold)', name: 'Personal' }
	};
	const fmt = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
	const deepHours = week.filter((b) => b.kind === 'deep').reduce((s, b) => s + (b.end - b.start), 0);

	let selected = $state<Block | null>(week.find((b) => b.note && b.kind === 'deep') ?? null);
</script>

<PageHeader title="My week" sub="Tasks, meetings and training on one calendar. Deep work lands where your energy is: mornings after good sleep." />

<div class="legend">
	{#each Object.entries(kindStyle) as [k, v] (k)}
		<span style:--hue={v.hue}><span class="hue-dot"></span>{v.name}</span>
	{/each}
	<span class="dim num total">{deepHours} h deep work planned</span>
</div>

{#if selected}
	<aside class="detail">
		<span class="hue-dot" style:--hue={kindStyle[selected.kind].hue}></span>
		<div>
			<p class="title">{selected.title}</p>
			<p class="muted small num">{days[selected.day]} · {fmt(selected.start)}–{fmt(selected.end)}{selected.project ? ` · ${selected.project}` : ''}</p>
			{#if selected.note}<p class="note small"><Icon name="sparkle" size={13} /> {selected.note}</p>{/if}
		</div>
	</aside>
{/if}

<div class="cal" style:--hour="{HOUR}px">
	<div class="gutter">
		{#each hours as h (h)}<span class="num" style:top="{(h - START) * HOUR}px">{h}:00</span>{/each}
	</div>
	{#each days as d, di (d)}
		<div class="day" class:today={di === TODAY_IDX}>
			<p class="dh">{d}</p>
			<div class="lane" style:height="{(END - START) * HOUR}px">
				{#each hours as h (h)}<span class="line" style:top="{(h - START) * HOUR}px"></span>{/each}
				{#if di === TODAY_IDX}
					<span class="now" style:top="{(NOW - START) * HOUR}px"><span class="sr-only">Now</span></span>
				{/if}
				{#each week.filter((b) => b.day === di) as b, i (b.title + b.start)}
					<button
						class="ev"
						class:sel={selected === b}
						style:top="{(b.start - START) * HOUR}px"
						style:height="{(b.end - b.start) * HOUR - 4}px"
						style:--hue={kindStyle[b.kind].hue}
						style:--i={i + di}
						onclick={() => (selected = b)}
						aria-label="{b.title}, {fmt(b.start)} to {fmt(b.end)}"
					>
						<span class="et">{b.title}</span>
						{#if b.end - b.start >= 1.5 || (b.end - b.start >= 1 && b.title.length <= 12)}<span class="tm num">{fmt(b.start)}–{fmt(b.end)}</span>{/if}
						{#if b.note}<Icon name="sparkle" size={12} />{/if}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>



<style>
	.small {
		font-size: var(--t-sm);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-4);
		margin-bottom: var(--s-4);
		font-size: var(--t-xs);
		font-weight: 600;
		color: var(--mist);
	}
	.legend > span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.legend .hue-dot {
		width: 7px;
		height: 7px;
	}
	.total {
		margin-left: auto;
	}
	.cal {
		display: grid;
		grid-template-columns: 48px repeat(7, minmax(110px, 1fr));
		overflow-x: auto;
		border-top: 1px solid var(--line);
	}
	.gutter {
		position: relative;
		margin-top: 40px;
	}
	.gutter span {
		position: absolute;
		right: 8px;
		translate: 0 -50%;
		font-size: 11px;
		color: var(--mist-dim);
	}
	.day {
		border-left: 1px solid var(--line);
	}
	.dh {
		height: 40px;
		display: grid;
		place-items: center;
		font-size: var(--t-sm);
		font-weight: 600;
		color: var(--mist);
	}
	.today .dh {
		color: var(--accent);
	}
	.today {
		background: linear-gradient(180deg, var(--accent-soft), transparent 60%);
	}
	.lane {
		position: relative;
	}
	.line {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--line);
		opacity: 0.6;
	}
	.now {
		position: absolute;
		left: -4px;
		right: 0;
		height: 2px;
		background: var(--bad);
		z-index: 2;
	}
	.now::before {
		content: '';
		position: absolute;
		left: 0;
		top: -4px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--bad);
	}
	.ev {
		position: absolute;
		left: 4px;
		right: 4px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: 6px 8px;
		border-radius: 10px;
		text-align: left;
		background: color-mix(in oklab, var(--hue) 20%, var(--night));
		border-left: 3px solid var(--hue);
		overflow: hidden;
		animation: in 520ms var(--ease-spring) both;
		animation-delay: calc(var(--i) * 25ms);
		transition:
			transform var(--dur) var(--ease-spring),
			box-shadow var(--dur);
	}
	.ev:hover,
	.ev.sel {
		transform: scale(1.025);
		box-shadow: 0 0 0 1px var(--hue), 0 10px 24px -12px var(--hue);
		z-index: 3;
	}
	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	.et {
		font-size: 12px;
		font-weight: 700;
		line-height: 1.25;
	}
	.tm {
		font-size: 11px;
		color: var(--mist);
	}
	.ev :global(svg) {
		color: var(--hue);
		position: absolute;
		top: 6px;
		right: 6px;
	}
	.detail {
		margin-bottom: var(--s-4);
		display: flex;
		gap: var(--s-3);
		align-items: flex-start;
		padding: var(--s-4);
		border-radius: var(--r-md);
		background: color-mix(in oklab, var(--slate) 92%, transparent);
		border: 1px solid var(--line);
		backdrop-filter: blur(14px);
		max-width: 560px;
	}
	.detail .hue-dot {
		margin-top: 8px;
	}
	.title {
		font-weight: 700;
	}
	.note {
		display: flex;
		gap: 6px;
		align-items: center;
		margin-top: 6px;
		color: var(--accent);
	}
	@media (max-width: 760px) {
		.cal {
			grid-template-columns: 40px repeat(7, 120px);
		}
	}
</style>
