<script lang="ts">
	import { resolve } from '$app/paths';
	import { AnimatedNumber, Icon, Meter, Sparkline } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { accounts, bills, budgets, month, netWorth, transactions } from '$lib/data/finance';
	import { chf, fmtDay, relDay } from '$lib/format';

	const total = accounts.reduce((s, a) => s + a.balance, 0);
	const left = month.income - month.spent;
	const paceShare = month.dayOfMonth / month.daysInMonth;
	const reviewCount = transactions.filter((t) => t.review).length;
	const kindIcon = { bank: 'wallet', card: 'tag', cash: 'wallet', pillar3a: 'shield', investment: 'trend', loan: 'repeat' } as const;
</script>

<PageHeader title="Overview" sub="{month.name}, day {month.dayOfMonth} of {month.daysInMonth}. Everything here comes from your bank files and receipts, processed on your own devices.">
	{#snippet actions()}
		<a class="btn" href={resolve('/finance/transactions')}><Icon name="inbox" size={16} /> Review {reviewCount}</a>
		<button class="btn btn-primary"><Icon name="plus" size={16} /> Import bank file</button>
	{/snippet}
</PageHeader>

<section class="hero">
	<div>
		<p class="muted">Net worth</p>
		<p class="big nw num"><AnimatedNumber value={total / 100} format={(n) => chf(n * 100, { whole: true })} duration={1200} /></p>
		<p class="up num"><Icon name="trend" size={16} /> + CHF 4’120 in 3 months</p>
	</div>
	<div class="spark">
		<Sparkline values={netWorth} width={420} height={110} label="Net worth over 24 months, rising" />
	</div>
</section>

<div class="split block">
	<section>
		<div class="block-head">
			<h2 class="section-title">November budgets</h2>
			<span class="dim small num">{chf(left, { whole: true })} left of income</span>
		</div>
		<ul class="budgets">
			{#each budgets as b (b.category)}
				{@const ratio = b.spent / b.limit}
				<li>
					<div class="bline">
						<span class="bname">{b.category}</span>
						<span class="num" class:over={ratio > 1} class:warn={ratio > paceShare + 0.2 && ratio <= 1}>{chf(b.spent, { whole: true })} <span class="dim">/ {chf(b.limit, { whole: true })}</span></span>
					</div>
					<Meter value={b.spent} max={b.limit} marker={paceShare} label="{b.category} budget" />
				</li>
			{/each}
		</ul>
		<p class="dim small legend">The white tick is where spending should be on day {month.dayOfMonth}. Fun is over by CHF 60.</p>
	</section>

	<aside>
		<section>
			<div class="block-head">
				<h2 class="section-title">Coming up</h2>
				<a href={resolve('/finance/bills')}>All bills</a>
			</div>
			<ul class="rows list">
				{#each bills.slice(0, 4) as b (b.name)}
					<li class="row">
						<div class="grow">
							<p class="title">{b.name}</p>
							<p class="meta">{fmtDay(b.due)} · {relDay(b.due)}</p>
						</div>
						<p class="amount">{chf(b.amount)}</p>
					</li>
				{/each}
			</ul>
		</section>

		<section class="block">
			<h2 class="section-title">Accounts</h2>
			<ul class="rows list">
				{#each accounts as a (a.name)}
					<li class="row">
						<span class="ai"><Icon name={kindIcon[a.kind]} size={16} /></span>
						<div class="grow">
							<p class="title">{a.name}</p>
							<p class="meta">{a.shared ? 'Shared with Lea' : 'Only you'}</p>
						</div>
						<p class="amount">{chf(a.balance)}</p>
					</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>

<style>
	.small {
		font-size: var(--t-xs);
	}
	.hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--s-6);
		padding-bottom: var(--s-6);
		border-bottom: 1px solid var(--line);
	}
	.nw {
		font-size: clamp(3rem, 2rem + 4vw, 5rem);
		margin: var(--s-2) 0;
	}
	.up {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		color: var(--good);
		font-weight: 600;
		font-size: var(--t-sm);
	}
	.spark {
		flex: 1;
		max-width: 420px;
		opacity: 0.95;
	}
	.spark :global(svg) {
		width: 100%;
		height: auto;
	}
	.budgets {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--s-4);
	}
	.bline {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
		font-size: var(--t-sm);
	}
	.bname {
		font-weight: 600;
	}
	.over {
		color: var(--bad);
		font-weight: 700;
	}
	.warn {
		color: var(--warn);
	}
	.legend {
		margin-top: var(--s-4);
	}
	.list {
		list-style: none;
		margin: var(--s-2) 0 0;
		padding: 0;
	}
	.ai {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: var(--accent-soft);
		color: var(--accent);
	}
	@media (max-width: 760px) {
		.hero {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
