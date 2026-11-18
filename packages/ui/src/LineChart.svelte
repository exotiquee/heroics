<script lang="ts">
	interface Point {
		x: string;
		y: number;
		/** Optional raw value drawn as a dot behind the line (e.g. daily weigh-ins). */
		raw?: number;
	}

	let {
		points,
		height = 220,
		color = 'var(--accent)',
		format = (n: number) => n.toFixed(1),
		xFormat = (s: string) => s,
		label
	}: {
		points: Point[];
		height?: number;
		color?: string;
		format?: (n: number) => string;
		xFormat?: (s: string) => string;
		label: string;
	} = $props();

	const uid = `line-${Math.random().toString(36).slice(2, 9)}`;
	const W = 640;
	const pad = { l: 8, r: 8, t: 16, b: 28 };

	let hover = $state<number | null>(null);

	const geo = $derived.by(() => {
		const ys = points.flatMap((p) => (p.raw === undefined ? [p.y] : [p.y, p.raw]));
		const min = Math.min(...ys);
		const max = Math.max(...ys);
		const spread = max - min || 1;
		const lo = min - spread * 0.15;
		const hi = max + spread * 0.15;
		const X = (i: number) => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r);
		const Y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
		const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('');
		const area = `${line}L${X(points.length - 1)} ${height - pad.b}L${X(0)} ${height - pad.b}Z`;
		const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1];
		return { X, Y, line, area, ticks };
	});

	function onMove(e: PointerEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * W;
		const i = Math.round(((x - pad.l) / (W - pad.l - pad.r)) * (points.length - 1));
		hover = Math.max(0, Math.min(points.length - 1, i));
	}
</script>

<div class="chart">
	<svg
		viewBox="0 0 {W} {height}"
		preserveAspectRatio="none"
		role="img"
		aria-label={label}
		onpointermove={onMove}
		onpointerleave={() => (hover = null)}
	>
		<defs>
			<linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stop-color={color} stop-opacity="0.28" />
				<stop offset="1" stop-color={color} stop-opacity="0" />
			</linearGradient>
		</defs>
		{#each points as p, i (p.x)}
			{#if p.raw !== undefined}
				<circle cx={geo.X(i)} cy={geo.Y(p.raw)} r="2.2" fill="var(--mist-dim)" opacity="0.55" />
			{/if}
		{/each}
		<path d={geo.area} fill="url(#{uid})" />
		<path class="line" d={geo.line} fill="none" stroke={color} stroke-width="2.25" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
		{#if hover !== null}
			{@const p = points[hover]!}
			<line x1={geo.X(hover)} x2={geo.X(hover)} y1={pad.t} y2={height - pad.b} stroke="var(--line-strong)" vector-effect="non-scaling-stroke" />
			<circle cx={geo.X(hover)} cy={geo.Y(p.y)} r="4.5" fill={color} stroke="var(--night)" stroke-width="2" vector-effect="non-scaling-stroke" />
		{/if}
	</svg>
	<div class="ticks dim">
		{#each geo.ticks as t (t)}
			<span>{xFormat(points[t]?.x ?? '')}</span>
		{/each}
	</div>
	{#if hover !== null}
		{@const p = points[hover]!}
		<div class="tip surface" style:left="{(geo.X(hover) / W) * 100}%">
			<strong class="num">{format(p.y)}</strong>
			<span class="dim">{xFormat(p.x)}</span>
		</div>
	{/if}
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		touch-action: none;
	}
	.line {
		stroke-dasharray: 2000;
		stroke-dashoffset: 2000;
		animation: draw 1.2s var(--ease-out) forwards;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
	.ticks {
		display: flex;
		justify-content: space-between;
		font-size: var(--t-xs);
		margin-top: -20px;
		padding: 0 4px;
		pointer-events: none;
	}
	.tip {
		position: absolute;
		top: 0;
		transform: translate(-50%, -110%);
		padding: 6px 10px;
		border-radius: var(--r-sm);
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: var(--t-sm);
		pointer-events: none;
		white-space: nowrap;
	}
</style>
