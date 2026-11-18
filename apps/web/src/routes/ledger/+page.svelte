<script lang="ts">
	import { Icon, LabelBadge, TierBadge } from '@heroics/ui';
	import { slide } from 'svelte/transition';
	import { LABELS, LABEL_COPY, route } from '@heroics/policy';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { APPS } from '$lib/apps';
	import { grants as seedGrants, ledger, type GrantRow } from '$lib/data/agent';
	import { fmtShort } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	let grants = $state<GrantRow[]>(seedGrants.map((g) => ({ ...g })));
	let openRow = $state<string | null>('l4');
	let filter = $state<'all' | 'cloud' | 'blocked'>('all');

	const rows = $derived(ledger.filter((l) => (filter === 'cloud' ? l.tier === 'cloud' : filter === 'blocked' ? l.outcome === 'blocked' : true)));
	const appOf = (id: string) => APPS.find((a) => a.id === id)!;
	const cloudTokens = ledger.filter((l) => l.tier === 'cloud').reduce((s, l) => s + (l.tokens ?? 0), 0);

	function toggle(g: GrantRow) {
		g.active = !g.active;
		toast(g.active ? `Grant restored: ${g.name}` : `Grant revoked: ${g.name}. Cloud AI can no longer read it.`);
	}

	// Live demo of the real policy router from @heroics/policy.
	let tryLabel = $state<(typeof LABELS)[number]>('personal');
	let tryGrant = $state(true);
	const decision = $derived(
		route({
			label: tryLabel,
			scope: 'finance.monthly_totals',
			preferred: 'cloud',
			available: ['device', 'box', 'cloud'],
			grants: tryGrant
				? [{ id: 'g1', scope: 'finance.monthly_totals', maxLabel: 'personal', purpose: 'Weekly review', createdAt: '2026-11-01T00:00:00Z', expiresAt: '2027-02-15T00:00:00Z', revokedAt: null }]
				: [],
			now: new Date('2026-11-18T12:00:00Z')
		})
	);
</script>

<PageHeader title="Privacy ledger" sub="Every AI run, where it happened and why. Cloud AI only ever sees what one of your grants allows, and you can revoke any grant here." />

<section class="summary">
	<div><p class="big num">211</p><p class="muted small">runs on your devices or server this week</p></div>
	<div><p class="big num">{ledger.filter((l) => l.tier === 'cloud').length}</p><p class="muted small">cloud runs, each under a grant</p></div>
	<div><p class="big num warn">{ledger.filter((l) => l.outcome === 'blocked').length}</p><p class="muted small">unsafe request stopped</p></div>
	<div><p class="big num">{cloudTokens.toLocaleString('de-CH')}</p><p class="muted small">tokens sent to the cloud</p></div>
</section>

<div class="split block">
	<section>
		<div class="block-head">
			<h2 class="section-title">Recent runs</h2>
			<div class="seg" role="radiogroup" aria-label="Filter runs">
				{#each [['all', 'All'], ['cloud', 'Cloud'], ['blocked', 'Stopped']] as const as [k, l] (k)}
					<button role="radio" aria-checked={filter === k} class:on={filter === k} onclick={() => (filter = k)}>{l}</button>
				{/each}
			</div>
		</div>
		<ul class="runs">
			{#each rows as r (r.id)}
				<li class="o-{r.outcome.replace(' ', '-')}">
					<button class="run" onclick={() => (openRow = openRow === r.id ? null : r.id)} aria-expanded={openRow === r.id}>
						<span class="hue-dot" style:--hue={appOf(r.app).hue}></span>
						<span class="grow">
							<span class="title">{r.what}</span>
							<span class="meta">{r.time} · {appOf(r.app).name}{r.grant ? ` · grant: ${r.grant}` : ''}</span>
						</span>
						<TierBadge tier={r.tier} />
						<LabelBadge label={r.label} compact />
						<span class="outcome">{r.outcome === 'ran' ? 'Ran' : r.outcome === 'kept local' ? 'Kept local' : 'Stopped'}</span>
					</button>
					{#if openRow === r.id && r.note}
						<p class="note" transition:slide={{ duration: 200 }}>{r.note}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<aside>
		<section>
			<h2 class="section-title">Your grants</h2>
			<p class="muted small">Cloud AI can read up to “Personal” data inside these scopes. Never private or sealed data.</p>
			<ul class="rows glist">
				{#each grants as g (g.id)}
					<li class="row" class:off={!g.active}>
						<div class="grow">
							<p class="title">{g.name}</p>
							<p class="meta">{g.purpose}</p>
							<p class="meta"><code>{g.scope}</code> · until {fmtShort(g.expires)}</p>
						</div>
						<button class="switch" role="switch" aria-checked={g.active} aria-label="Grant {g.name}" onclick={() => toggle(g)}><span></span></button>
					</li>
				{/each}
			</ul>
		</section>

		<section class="block try">
			<h2 class="section-title">Try the router</h2>
			<p class="muted small">This runs the real policy code from the suite. Ask for cloud AI and see where the run is allowed to go.</p>
			<div class="labels" role="radiogroup" aria-label="Data label">
				{#each LABELS as l (l)}
					<button role="radio" aria-checked={tryLabel === l} class:on={tryLabel === l} onclick={() => (tryLabel = l)} style:--c="var(--label-{l})">{LABEL_COPY[l].name}</button>
				{/each}
			</div>
			<label class="check"><input type="checkbox" bind:checked={tryGrant} /> Grant “Monthly totals” is active</label>
			<div class="verdict" class:no={!decision.ok}>
				{#if decision.ok}
					<TierBadge tier={decision.tier} />
				{:else}
					<span class="chip"><Icon name="x" size={12} /> Refused</span>
				{/if}
				<p>{decision.grantId ? 'Cloud AI allowed by your “Monthly totals” grant' : decision.reason}</p>
			</div>
		</section>
	</aside>
</div>

<style>
	.small {
		font-size: var(--t-sm);
	}
	.summary {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--s-5);
		padding-bottom: var(--s-6);
		border-bottom: 1px solid var(--line);
	}
	.summary .big {
		font-size: clamp(2rem, 1.6rem + 1.6vw, 3rem);
	}
	.warn {
		color: var(--warn);
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
	}
	.seg button.on {
		background: var(--accent);
		color: var(--night-deep);
	}
	.runs {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.runs li + li {
		border-top: 1px solid var(--line);
	}
	.run {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--s-3);
		padding: var(--s-3) 0;
		text-align: left;
	}
	.grow {
		flex: 1;
		min-width: 0;
		display: grid;
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
	.outcome {
		width: 78px;
		text-align: right;
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--mist);
	}
	.o-blocked .outcome {
		color: var(--warn);
	}
	.o-blocked .title::before {
		content: '';
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-right: 8px;
		border-radius: 2px;
		background: var(--warn);
		transform: rotate(45deg) translateY(-1px);
	}
	.note {
		margin: 0 0 var(--s-3) 20px;
		padding: var(--s-3);
		border-radius: var(--r-sm);
		background: var(--night-deep);
		font-size: var(--t-sm);
		color: var(--mist);
	}
	.glist {
		list-style: none;
		margin: var(--s-3) 0 0;
		padding: 0;
	}
	.glist .off .title,
	.glist .off .meta {
		opacity: 0.45;
		text-decoration: line-through;
	}
	code {
		font-size: 11.5px;
		background: var(--night-deep);
		padding: 1px 5px;
		border-radius: 4px;
	}
	.switch {
		width: 42px;
		height: 24px;
		border-radius: var(--r-pill);
		background: var(--slate-3);
		padding: 3px;
		flex: none;
		transition: background var(--dur) var(--ease-out);
	}
	.switch span {
		display: block;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--paper);
		transition: transform var(--dur) var(--ease-spring);
	}
	.switch[aria-checked='true'] {
		background: var(--accent);
	}
	.switch[aria-checked='true'] span {
		transform: translateX(18px);
	}
	.labels {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-2);
		margin: var(--s-4) 0 var(--s-3);
	}
	.labels button {
		height: 30px;
		padding: 0 12px;
		border-radius: var(--r-pill);
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--c);
		border: 1px solid color-mix(in oklab, var(--c) 40%, transparent);
	}
	.labels button.on {
		background: color-mix(in oklab, var(--c) 20%, transparent);
	}
	.check {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		font-size: var(--t-sm);
		color: var(--mist);
	}
	.check input {
		accent-color: var(--gold);
	}
	.verdict {
		margin-top: var(--s-4);
		display: flex;
		align-items: center;
		gap: var(--s-3);
		padding: var(--s-3) var(--s-4);
		border-radius: var(--r-md);
		background: var(--night-deep);
		border: 1px solid var(--line);
		font-size: var(--t-sm);
	}
	.verdict.no {
		border-color: color-mix(in oklab, var(--warn) 40%, transparent);
	}
	@media (max-width: 760px) {
		.summary {
			grid-template-columns: repeat(2, 1fr);
		}
		.run :global(.badge) {
			display: none;
		}
	}
</style>
