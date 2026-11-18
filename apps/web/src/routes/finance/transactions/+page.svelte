<script lang="ts">
	import { Icon, LabelBadge } from '@heroics/ui';
	import { flip } from 'svelte/animate';
	import { fly, slide } from 'svelte/transition';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { transactions as seed, type Tx } from '$lib/data/finance';
	import { chf, fmtDay } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	let txs = $state<Tx[]>(seed.map((t) => ({ ...t })));
	let filter = $state<'all' | 'out' | 'in' | 'tax'>('all');
	let query = $state('');

	const inbox = $derived(txs.filter((t) => t.review));
	const list = $derived(
		txs
			.filter((t) => !t.review)
			.filter((t) => (filter === 'out' ? t.amount < 0 : filter === 'in' ? t.amount > 0 : filter === 'tax' ? !!t.tax : true))
			.filter((t) => !query || `${t.counterparty} ${t.memo} ${t.category}`.toLowerCase().includes(query.toLowerCase()))
	);

	function accept(t: Tx, category = t.review!.suggestion) {
		const target = txs.find((x) => x.id === t.id)!;
		target.category = category;
		target.review = undefined;
		toast(`${t.counterparty} → ${category}. Next time it’s automatic.`);
	}

	const groups = $derived.by(() => {
		const map = new Map<string, Tx[]>();
		for (const t of list) map.set(t.date, [...(map.get(t.date) ?? []), t]);
		return [...map.entries()];
	});
</script>

<PageHeader title="Transactions" sub="Your own rules run first, then a model on your server suggests a category. Low confidence lands in the inbox." />

{#if inbox.length}
	<section class="inbox" transition:slide>
		<div class="block-head">
			<h2 class="section-title">Review inbox <span class="count num">{inbox.length}</span></h2>
			<span class="dim small"><LabelBadge label="private" compact /> Categorised on your server</span>
		</div>
		<ul>
			{#each inbox as t (t.id)}
				<li animate:flip={{ duration: 280 }} out:fly={{ x: 40, duration: 220 }}>
					<div class="grow">
						<p class="title">{t.counterparty}</p>
						<p class="meta">{t.memo} · {fmtDay(t.date)}</p>
					</div>
					<p class="amount" class:in={t.amount > 0}>{chf(t.amount, { sign: true })}</p>
					<div class="suggest">
						<span class="conf" style:--p="{t.review!.confidence * 100}%" title="Confidence {Math.round(t.review!.confidence * 100)}%"></span>
						<button class="btn btn-sm btn-primary" onclick={() => accept(t)}><Icon name="check" size={14} /> {t.review!.suggestion}</button>
						<select aria-label="Choose another category for {t.counterparty}" onchange={(e) => accept(t, (e.currentTarget as HTMLSelectElement).value)}>
							<option value="" selected disabled>Other…</option>
							{#each ['Groceries', 'Eating out', 'Transport', 'Fun', 'Home', 'Health', 'Settle-up'] as c (c)}<option>{c}</option>{/each}
						</select>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<p class="clear muted" in:fly={{ y: 8 }}><Icon name="check" size={18} /> Inbox clear. Every transaction has a category.</p>
{/if}

<section class="block">
	<div class="toolbar">
		<div class="seg" role="radiogroup" aria-label="Filter">
			{#each [['all', 'All'], ['out', 'Money out'], ['in', 'Money in'], ['tax', 'Tax relevant']] as const as [k, l] (k)}
				<button role="radio" aria-checked={filter === k} class:on={filter === k} onclick={() => (filter = k)}>{l}</button>
			{/each}
		</div>
		<label class="search">
			<Icon name="search" size={16} />
			<input bind:value={query} placeholder="Search merchant or category" aria-label="Search transactions" />
		</label>
	</div>

	{#each groups as [date, items] (date)}
		<h3 class="day">{fmtDay(date)}</h3>
		<ul class="rows list">
			{#each items as t (t.id)}
				<li class="row">
					<div class="grow">
						<p class="title">{t.counterparty}</p>
						<p class="meta">{t.category} · {t.account}{t.memo ? ` · ${t.memo}` : ''}</p>
					</div>
					{#if t.receipt}<span class="chip" title="Receipt attached, sealed"><Icon name="receipt" size={12} /> Receipt</span>{/if}
					{#if t.tax}<span class="chip tax"><Icon name="file" size={12} /> {t.tax}</span>{/if}
					<p class="amount" class:in={t.amount > 0}>{chf(t.amount, { sign: true })}</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="muted empty">No transactions match. Clear the search or pick another filter.</p>
	{/each}
</section>

<style>
	.small {
		font-size: var(--t-xs);
	}
	.inbox {
		padding: var(--s-5);
		border-radius: var(--r-lg);
		background: color-mix(in oklab, var(--slate) 75%, transparent);
		border: 1px solid var(--accent-line);
	}
	.count {
		display: inline-grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		margin-left: 6px;
		padding: 0 7px;
		border-radius: var(--r-pill);
		background: var(--accent);
		color: var(--night-deep);
		font-size: var(--t-xs);
		vertical-align: 3px;
	}
	.inbox ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.inbox li {
		display: flex;
		align-items: center;
		gap: var(--s-4);
		padding: var(--s-3) 0;
	}
	.inbox li + li {
		border-top: 1px solid var(--line);
	}
	.grow {
		flex: 1;
		min-width: 0;
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
	.suggest {
		display: flex;
		align-items: center;
		gap: var(--s-2);
	}
	.conf {
		width: 32px;
		height: 6px;
		border-radius: 3px;
		background: linear-gradient(90deg, var(--accent) var(--p), var(--slate-3) var(--p));
	}
	select {
		height: 30px;
		padding: 0 8px;
		border-radius: var(--r-pill);
		background: var(--slate-2);
		border: 0;
		font-size: var(--t-xs);
		font-weight: 600;
		color: var(--mist);
	}
	.clear {
		display: flex;
		gap: var(--s-2);
		align-items: center;
	}
	.clear :global(svg) {
		color: var(--good);
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: var(--s-3);
		flex-wrap: wrap;
		margin-bottom: var(--s-4);
	}
	.seg {
		display: inline-flex;
		padding: 3px;
		border-radius: var(--r-pill);
		background: var(--slate);
		overflow-x: auto;
	}
	.seg button {
		height: 30px;
		padding: 0 12px;
		border-radius: var(--r-pill);
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--mist);
		white-space: nowrap;
	}
	.seg button.on {
		background: var(--accent);
		color: var(--night-deep);
	}
	.search {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		height: 36px;
		padding: 0 var(--s-3);
		border-radius: var(--r-pill);
		background: var(--slate);
		color: var(--mist);
		min-width: 240px;
	}
	.search input {
		background: none;
		border: 0;
		outline: none;
		flex: 1;
		font-size: var(--t-sm);
	}
	.search:focus-within {
		outline: 2px solid var(--accent);
	}
	.day {
		font-family: var(--font-body);
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--mist-dim);
		margin: var(--s-4) 0 0;
		letter-spacing: 0;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.tax {
		color: var(--accent);
		background: var(--accent-soft);
	}
	.empty {
		padding: var(--s-6) 0;
	}
	@media (max-width: 760px) {
		.inbox li {
			flex-wrap: wrap;
		}
		.suggest {
			width: 100%;
		}
		.chip {
			display: none;
		}
	}
</style>
