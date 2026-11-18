<script lang="ts">
	let {
		values,
		width = 120,
		height = 36,
		color = 'var(--accent)',
		label
	}: { values: number[]; width?: number; height?: number; color?: string; label: string } = $props();

	const uid = `spark-${Math.random().toString(36).slice(2, 9)}`;

	const path = $derived.by(() => {
		if (values.length < 2) return { line: '', area: '' };
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1;
		const pts = values.map((v, i) => [
			(i / (values.length - 1)) * width,
			height - 3 - ((v - min) / span) * (height - 6)
		]);
		const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x!.toFixed(1)} ${y!.toFixed(1)}`).join('');
		return { line, area: `${line}L${width} ${height}L0 ${height}Z` };
	});
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label={label}>
	<defs>
		<linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
			<stop offset="0" stop-color={color} stop-opacity="0.35" />
			<stop offset="1" stop-color={color} stop-opacity="0" />
		</linearGradient>
	</defs>
	<path d={path.area} fill="url(#{uid})" />
	<path d={path.line} fill="none" stroke={color} stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" />
</svg>
