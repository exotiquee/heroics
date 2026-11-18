<script lang="ts">
	import { Icon } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { bills, subscriptions } from '$lib/data/finance';
	import { chf, daysBetween, fmtDay, relDay, TODAY } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	const horizon = 50;
	const monthlySubs = subscriptions.reduce((s, x) => s + x.monthly, 0);
	const unusedSubs = subscriptions.filter((s) => s.unused);
	const savings = unusedSubs.reduce((s, x) => s + x.monthly * 12, 0);
</script>

<PageHeader title="Bills" sub="QR-bills, eBills and standing orders on one timeline. Price changes and unused subscriptions are flagged." />

<section>
	<h2 class="section-title">Next {horizon} days</h2>
	<div class="timeline" role="list">
		<div class="axis" aria-hidden="true">
			{#each [0, 10, 20, 30, 40, 50] as d (d)}
				<span style:left="{(d / horizon) * 100}%">{d === 0 ? 'Today' : `+${d} d`}</span>
			{/each}
		</div>
		{#each bills as b, i (b.name)}
			{@const d = daysBetween(TODAY, b.due)}
			{#if d <= horizon}
				<div class="bill" role="listitem" style:left="{(d / horizon) * 100}%" style:--row={i % 2} style:--i={i}>
					<span class="pin" aria-hidden="true"></span>
					<p class="bn">{b.name}</p>
					<p class="ba num">{chf(b.amount, { whole: true })}</p>
				</div>
			{/if}
		{/each}
	</div>
</section>

<div class="split block">
	<section>
		<h2 class="section-title">All bills</h2>
		<ul class="rows list">
			{#each bills as b (b.name)}
				<li class="row">
					<span class="bi"><Icon name={b.kind === 'QR-bill' ? 'qr' : b.kind === 'eBill' ? 'file' : 'repeat'} size={16} /></span>
					<div class="grow">
						<p class="title">{b.name}</p>
						<p class="meta">{b.kind} · {fmtDay(b.due)} · {relDay(b.due)}</p>
					</div>
					{#if b.change}<span class="chip up num" title="Price went up">+{chf(b.change)}</span>{/if}
					<p class="amount">{chf(b.amount)}</p>
				</li>
			{/each}
		</ul>
	</section>

	<aside>
		<section class="subs">
			<h2 class="section-title">Subscriptions</h2>
			<p class="muted small num">{chf(monthlySubs)} a month across {subscriptions.length}</p>
			<ul class="rows list">
				{#each subscriptions as s (s.name)}
					<li class="row">
						<div class="grow">
							<p class="title">{s.name}</p>
							<p class="meta" class:warn={s.unused}>Last used {s.lastUsed}</p>
						</div>
						<p class="amount">{chf(s.monthly)}</p>
					</li>
				{/each}
			</ul>
			<div class="save">
				<p><strong class="num">{chf(savings, { whole: true })}</strong> a year in {unusedSubs.length} subscriptions you haven’t used in over a month.</p>
				<button class="btn btn-sm btn-primary" onclick={() => toast('Drafted 2 cancellation emails. They’re waiting in Projects for your review.')}>Draft cancellations</button>
			</div>
		</section>
	</aside>
</div>

<style>
	.small {
		font-size: var(--t-sm);
	}
	.timeline {
		position: relative;
		height: 170px;
		margin: var(--s-5) var(--s-6) 0 var(--s-2);
		border-bottom: 1px solid var(--line-strong);
	}
	.axis span {
		position: absolute;
		bottom: -24px;
		translate: -50% 0;
		font-size: var(--t-xs);
		color: var(--mist-dim);
		white-space: nowrap;
	}
	.bill {
		position: absolute;
		bottom: 0;
		translate: -50% 0;
		display: grid;
		justify-items: center;
		text-align: center;
		padding-bottom: calc(14px + var(--row) * 58px);
		animation: drop 700ms var(--ease-spring) both;
		animation-delay: calc(var(--i) * 80ms);
	}
	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-14px);
		}
	}
	.pin {
		position: absolute;
		bottom: -5px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 12px var(--accent);
	}
	.bill::after {
		content: '';
		position: absolute;
		bottom: 4px;
		height: calc(8px + var(--row) * 58px);
		width: 1px;
		background: var(--accent-line);
	}
	.bn,
	.ba {
		position: relative;
		z-index: 1;
		padding: 0 6px;
		background: var(--night);
		border-radius: 4px;
	}
	.bn {
		font-weight: 600;
		font-size: var(--t-sm);
		white-space: nowrap;
	}
	.ba {
		font-size: var(--t-xs);
		color: var(--mist);
	}
	.list {
		list-style: none;
		margin: var(--s-3) 0 0;
		padding: 0;
	}
	.bi {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: var(--accent-soft);
		color: var(--accent);
	}
	.up {
		color: var(--warn);
		background: color-mix(in oklab, var(--warn) 14%, transparent);
	}
	.warn {
		color: var(--warn);
	}
	.save {
		margin-top: var(--s-4);
		padding: var(--s-4);
		border-radius: var(--r-md);
		background: var(--accent-soft);
		border: 1px solid var(--accent-line);
		display: grid;
		gap: var(--s-3);
		justify-items: start;
		font-size: var(--t-sm);
	}
	@media (max-width: 760px) {
		.timeline {
			margin-right: var(--s-5);
		}
		.bn {
			font-size: var(--t-xs);
		}
	}
</style>
