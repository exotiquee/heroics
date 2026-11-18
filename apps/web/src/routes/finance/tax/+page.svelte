<script lang="ts">
	import { Icon, Ring } from '@heroics/ui';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { taxItems, taxYear, type TaxRow } from '$lib/data/finance';
	import { toast } from '$lib/state.svelte';

	let items = $state<TaxRow[]>(taxItems.map((t) => ({ ...t })));
	const relevant = $derived(items.filter((t) => t.status !== 'not_applicable'));
	const complete = $derived(relevant.filter((t) => t.status === 'complete').length);
	const sections = $derived([...new Set(items.map((t) => t.section))]);

	const statusCopy = { complete: 'Ready', partial: 'In progress', missing: 'Missing', not_applicable: 'Not needed' } as const;

	function confirm(t: TaxRow) {
		const target = items.find((x) => x.title === t.title)!;
		target.status = 'complete';
		target.evidence = target.evidence.replace(' is a candidate; confirm it', ' confirmed');
		toast(`${t.title} marked ready`);
	}
</script>

<PageHeader title="Tax year {taxYear}" sub="Heroics collects the evidence all year. In February you download one pack. It organises documents; it doesn’t give tax advice.">
	{#snippet actions()}
		<button class="btn btn-primary" onclick={() => toast(`Tax pack built on this device: ${complete} of ${relevant.length} sections ready so far.`)}><Icon name="file" size={16} /> Build tax pack</button>
	{/snippet}
</PageHeader>

<section class="status">
	<Ring value={complete / relevant.length} size={150} stroke={12} label="{complete} of {relevant.length} sections ready">
		<div>
			<p class="big n num">{complete}<span class="of">/{relevant.length}</span></p>
			<p class="dim small">ready</p>
		</div>
	</Ring>
	<div>
		<h2 class="section-title">Most of your return is already assembled</h2>
		<p class="muted">Items tick themselves off when the matching document lands in Vault or the matching payments appear. Your salary certificate arrives in January.</p>
		<p class="muted small rules">Rules: Canton of Zurich, version 2026.2. Limits and eligibility come from this rules file, never from an AI.</p>
	</div>
</section>

{#each sections as section (section)}
	<section class="block">
		<h2 class="section-title">{section}</h2>
		<ul class="rows list">
			{#each items.filter((t) => t.section === section) as t (t.title)}
				<li class="row s-{t.status}">
					<span class="mark" aria-hidden="true">
						{#if t.status === 'complete'}<Icon name="check" size={14} stroke={2.6} />{:else if t.status === 'partial'}<span class="half"></span>{/if}
					</span>
					<div class="grow">
						<p class="title">{t.title}</p>
						<p class="meta">{t.evidence}</p>
					</div>
					{#if t.auto}<span class="chip">Found automatically</span>{/if}
					{#if t.title === 'Work equipment' && t.status === 'partial'}
						<button class="btn btn-sm btn-primary" onclick={() => confirm(t)}>Confirm</button>
					{/if}
					<span class="st">{statusCopy[t.status]}</span>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<style>
	.small {
		font-size: var(--t-xs);
	}
	.status {
		display: flex;
		gap: var(--s-6);
		align-items: center;
		padding-bottom: var(--s-6);
		border-bottom: 1px solid var(--line);
	}
	.status .muted {
		margin-top: var(--s-2);
		max-width: 60ch;
	}
	.n {
		font-size: 2.8rem;
	}
	.of {
		font-size: var(--t-lg);
		color: var(--mist);
	}
	.rules {
		margin-top: var(--s-3);
	}
	.list {
		list-style: none;
		margin: var(--s-2) 0 0;
		padding: 0;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--line-strong);
		flex: none;
	}
	.s-complete .mark {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--night-deep);
		animation: pop 500ms var(--ease-spring);
	}
	@keyframes pop {
		from {
			transform: scale(0.6);
		}
	}
	.s-partial .mark {
		border-color: var(--warn);
	}
	.half {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: linear-gradient(90deg, var(--warn) 50%, transparent 50%);
	}
	.s-missing .mark {
		border-style: dashed;
	}
	.s-not_applicable {
		opacity: 0.5;
	}
	.st {
		width: 90px;
		text-align: right;
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--mist);
	}
	.s-complete .st {
		color: var(--accent);
	}
	.s-partial .st {
		color: var(--warn);
	}
	@media (max-width: 760px) {
		.status {
			flex-direction: column;
			align-items: flex-start;
		}
		.chip {
			display: none;
		}
	}
</style>
