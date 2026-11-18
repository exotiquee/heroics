<script lang="ts">
	import { Icon, LabelBadge } from '@heroics/ui';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { hourlyRateMinor, timeEntries } from '$lib/data/projects';
	import { chf, fmtDay, minutes, seeded } from '$lib/format';
	import { toast } from '$lib/state.svelte';

	const billable = timeEntries.filter((t) => t.billable);
	const billableMin = billable.reduce((s, t) => s + t.minutes, 0);
	const totalMin = timeEntries.reduce((s, t) => s + t.minutes, 0);
	const amount = Math.round((billableMin / 60) * hourlyRateMinor);
	const vat = 0; // below the VAT registration threshold in this example

	let drafted = $state(false);

	// Decorative QR pattern for the preview. A real Swiss QR-bill encodes the payment data.
	const qr = (() => {
		const rnd = seeded(42);
		const n = 25;
		const cells: [number, number][] = [];
		const finder = (x: number, y: number) =>
			(x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
		for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) cells.push([x, y]);
		return { n, cells };
	})();
</script>

<PageHeader title="Time & billing" sub="Alpine Dental rollout · CHF {(hourlyRateMinor / 100).toFixed(0)} per hour. Tracked hours become a Swiss QR-bill invoice, and the payment is matched when your bank file comes in." />

<div class="split">
	<section>
		<div class="stats">
			<div>
				<p class="big n num">{minutes(billableMin)}</p>
				<p class="muted small">billable since the last invoice</p>
			</div>
			<div>
				<p class="big n num">{chf(amount, { whole: true })}</p>
				<p class="muted small">ready to invoice</p>
			</div>
		</div>
		<ul class="rows list">
			{#each timeEntries as t (t.date + t.task)}
				<li class="row">
					<div class="grow">
						<p class="title">{t.task}</p>
						<p class="meta">{fmtDay(t.date)}</p>
					</div>
					<span class="chip" class:nb={!t.billable}>{t.billable ? 'Billable' : 'Not billable'}</span>
					<p class="num amount">{minutes(t.minutes)}</p>
				</li>
			{/each}
		</ul>
		<p class="dim small foot num">{minutes(totalMin)} tracked in total · {minutes(totalMin - billableMin)} not billable</p>
	</section>

	<aside>
		<div class="invoice" class:drafted>
			<header>
				<div>
					<p class="dim small">Invoice</p>
					<p class="inv-no">H-2026-015</p>
				</div>
				<LabelBadge label="private" />
			</header>
			<dl>
				<div><dt class="dim">To</dt><dd>Alpine Dental AG, Winterthur</dd></div>
				<div><dt class="dim">Hours</dt><dd class="num">{(billableMin / 60).toFixed(1)} h × {chf(hourlyRateMinor)}</dd></div>
				<div><dt class="dim">VAT</dt><dd class="num">{chf(vat)}</dd></div>
			</dl>
			<p class="total num">{chf(amount)}</p>

			<div class="qrbill">
				<svg viewBox="-2 -2 29 29" class="qr" role="img" aria-label="QR-bill preview pattern">
					<rect x="-2" y="-2" width="29" height="29" fill="white" />
					{#each [[0, 0], [18, 0], [0, 18]] as [fx, fy] (`${fx}-${fy}`)}
						<rect x={fx} y={fy} width="7" height="7" fill="#131a2c" />
						<rect x={fx! + 1} y={fy! + 1} width="5" height="5" fill="white" />
						<rect x={fx! + 2} y={fy! + 2} width="3" height="3" fill="#131a2c" />
					{/each}
					{#each qr.cells as [x, y] (`${x}-${y}`)}<rect {x} {y} width="1" height="1" fill="#131a2c" />{/each}
					<rect x="10.5" y="10.5" width="4" height="4" fill="white" />
					<path d="M11.5 12.5h2M12.5 11.5v2" stroke="#d00" stroke-width="0.9" />
				</svg>
				<div class="qrtext small">
					<p class="muted">Payable to</p>
					<p>CH44 3199 9123 0008 8901 2</p>
					<p class="muted">Reference</p>
					<p class="num">RF18 5390 0754 7034</p>
				</div>
			</div>

			{#if drafted}
				<p class="ok" in:scale={{ start: 0.8, duration: 380, easing: backOut }}><Icon name="check" size={16} /> Draft saved. Waiting for payment, matched automatically.</p>
			{:else}
				<button class="btn btn-primary wide" onclick={() => { drafted = true; toast('Invoice H-2026-015 drafted on your server'); }}><Icon name="qr" size={16} /> Draft invoice</button>
			{/if}
			<p class="dim small fine">Preview with sample account details. Runs on your server: this project is set to Local AI.</p>
		</div>
	</aside>
</div>

<style>
	.small {
		font-size: var(--t-xs);
	}
	.stats {
		display: flex;
		gap: var(--s-7);
		margin-bottom: var(--s-5);
	}
	.n {
		font-size: clamp(2.2rem, 1.8rem + 1.6vw, 3rem);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.nb {
		opacity: 0.6;
	}
	.foot {
		margin-top: var(--s-3);
	}
	.invoice {
		position: relative;
		padding: var(--s-5);
		border-radius: var(--r-lg);
		background: linear-gradient(170deg, color-mix(in oklab, var(--accent) 12%, var(--slate)), var(--slate) 55%);
		border: 1px solid var(--accent-line);
		box-shadow: var(--shadow-lift);
		transition: transform var(--dur-slow) var(--ease-spring);
	}
	.invoice.drafted {
		transform: rotate(-0.6deg);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.inv-no {
		font-family: var(--font-display);
		font-size: var(--t-xl);
		font-weight: 600;
	}
	dl {
		margin: var(--s-4) 0;
		display: grid;
		gap: var(--s-2);
		font-size: var(--t-sm);
	}
	dl div {
		display: flex;
		justify-content: space-between;
		gap: var(--s-3);
	}
	dd {
		margin: 0;
		text-align: right;
	}
	.total {
		font-family: var(--font-display);
		font-size: var(--t-2xl);
		font-weight: 650;
		padding: var(--s-3) 0;
		border-top: 1px dashed var(--line-strong);
	}
	.qrbill {
		display: flex;
		gap: var(--s-4);
		align-items: center;
		margin: var(--s-3) 0 var(--s-4);
		padding: var(--s-3);
		border-radius: var(--r-md);
		background: var(--night-deep);
	}
	.qr {
		width: 108px;
		height: 108px;
		border-radius: 6px;
		flex: none;
	}
	.qrtext p:not(.muted) {
		font-weight: 600;
		margin-bottom: 4px;
	}
	.wide {
		width: 100%;
		justify-content: center;
	}
	.ok {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		color: var(--good);
		font-weight: 600;
		font-size: var(--t-sm);
	}
	.fine {
		margin-top: var(--s-3);
	}
</style>
