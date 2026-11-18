<script lang="ts">
	import { Icon, LabelBadge } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { vault } from '$lib/data/finance';
	import { daysBetween, fmtShort, TODAY } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	const kindIcon = { Contract: 'note', Insurance: 'shield', ID: 'users', Warranty: 'tag', Tax: 'file' } as const;
	const soon = vault.filter((v) => v.expires && daysBetween(TODAY, v.expires) < 75);
</script>

<PageHeader title="Vault" sub="Contracts, policies, IDs, warranties and tax papers. Every file is sealed: encrypted on your device before it’s stored.">
	{#snippet actions()}
		<button class="btn btn-primary" onclick={() => toast('Scan documents with your phone. Text is read on the device.')}><Icon name="camera" size={16} /> Add document</button>
	{/snippet}
</PageHeader>

{#if soon.length}
	<section class="soon">
		<Icon name="alert" size={18} />
		<p>
			{#each soon as v, i (v.name)}{i ? ' and ' : ''}<strong>{v.name}</strong> expires {fmtShort(v.expires!)}{/each}.
			Heroics adds a renewal task two weeks before.
		</p>
	</section>
{/if}

<ul class="docs">
	{#each vault as v, i (v.name)}
		{@const days = v.expires ? daysBetween(TODAY, v.expires) : null}
		<li style:--i={i}>
			<span class="di"><Icon name={kindIcon[v.kind as keyof typeof kindIcon]} size={20} /></span>
			<p class="title">{v.name}</p>
			<p class="meta">{v.kind} · added {fmtShort(v.added)}</p>
			<div class="foot">
				<LabelBadge label="sealed" />
				{#if days !== null}
					<span class="exp" class:warn={days < 75}>{days < 75 ? `Expires in ${days} days` : `Valid until ${fmtShort(v.expires!)}`}</span>
				{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.soon {
		display: flex;
		gap: var(--s-3);
		align-items: flex-start;
		padding: var(--s-4);
		margin-bottom: var(--s-6);
		border-radius: var(--r-md);
		background: color-mix(in oklab, var(--warn) 10%, transparent);
		border: 1px solid color-mix(in oklab, var(--warn) 35%, transparent);
		color: var(--paper);
		font-size: var(--t-sm);
	}
	.soon :global(svg) {
		color: var(--warn);
		flex: none;
		margin-top: 1px;
	}
	.docs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--s-4);
	}
	.docs li {
		position: relative;
		padding: var(--s-5) var(--s-4) var(--s-4);
		border-radius: var(--r-sm) var(--r-lg) var(--r-sm) var(--r-sm);
		background: linear-gradient(165deg, var(--slate), color-mix(in oklab, var(--night-deep) 70%, transparent));
		border: 1px solid var(--line);
		animation: rise 600ms var(--ease-spring) both;
		animation-delay: calc(var(--i) * 50ms);
		transition: transform var(--dur) var(--ease-spring), border-color var(--dur);
	}
	.docs li:hover {
		transform: translateY(-3px) rotate(-0.4deg);
		border-color: var(--accent-line);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
	.di {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: var(--accent-soft);
		color: var(--accent);
		margin-bottom: var(--s-4);
	}
	.title {
		font-weight: 600;
	}
	.meta {
		font-size: var(--t-sm);
		color: var(--mist);
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s-2);
		margin-top: var(--s-4);
	}
	.exp {
		font-size: var(--t-xs);
		color: var(--mist);
	}
	.exp.warn {
		color: var(--warn);
		font-weight: 700;
	}
</style>
