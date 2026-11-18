<!-- The one bold element: a soft light behind everything that takes on the current app's hue. -->
<div class="field" aria-hidden="true">
	<div class="glow a"></div>
	<div class="glow b"></div>
	<div class="grain"></div>
</div>

<style>
	.field {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		background: radial-gradient(120% 90% at 50% 0%, var(--night) 40%, var(--night-deep) 100%);
	}
	.glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		transition:
			background 900ms var(--ease-out),
			transform 1400ms var(--ease-spring);
	}
	.a {
		width: 62vmax;
		height: 46vmax;
		top: -22vmax;
		right: -12vmax;
		background: radial-gradient(closest-side, color-mix(in oklab, var(--glow-a) 34%, transparent), transparent);
	}
	.b {
		width: 48vmax;
		height: 40vmax;
		bottom: -26vmax;
		left: 4vmax;
		background: radial-gradient(closest-side, color-mix(in oklab, var(--glow-b) 18%, transparent), transparent);
	}
	:global([data-app='fitness']) .a {
		transform: translate(-6vmax, 2vmax) scale(1.05);
	}
	:global([data-app='finance']) .a {
		transform: translate(-18vmax, -2vmax) scale(0.95);
	}
	:global([data-app='projects']) .a {
		transform: translate(-30vmax, 1vmax) scale(1.1);
	}
	.grain {
		position: absolute;
		inset: 0;
		opacity: 0.07;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
</style>
