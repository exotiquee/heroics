<script lang="ts">
	import { Icon, LabelBadge, TierBadge } from '@heroics/ui';
	import { fly, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { chat as seedChat, type ChatTurn } from '$lib/data/agent';
	import { APPS } from '$lib/apps';
	import { queue, shell } from '$lib/state.svelte';

	let tab = $state<'approvals' | 'chat'>('approvals');
	let turns = $state<ChatTurn[]>([...seedChat]);
	let draft = $state('');
	let thinking = $state(false);
	let log = $state<HTMLElement>();

	const appHue = (id: string) => APPS.find((a) => a.id === id)?.hue ?? 'var(--gold)';
	const appName = (id: string) => APPS.find((a) => a.id === id)?.name ?? 'HQ';

	function send(e: SubmitEvent) {
		e.preventDefault();
		const text = draft.trim();
		if (!text) return;
		turns = [...turns, { role: 'user', text }];
		draft = '';
		thinking = true;
		setTimeout(() => {
			thinking = false;
			turns = [
				...turns,
				{
					role: 'agent',
					text: 'This preview runs on sample data, so I can’t answer new questions yet. In the full suite I’d check your question’s labels first, then run it on this device or your server, and only use cloud AI if one of your grants covers it.',
					steps: [{ tool: 'router.route', tier: 'device', label: 'open' }]
				}
			];
		}, 900);
	}

	$effect(() => {
		void turns.length;
		void thinking;
		queueMicrotask(() => log?.scrollTo({ top: log.scrollHeight, behavior: 'smooth' }));
	});
</script>

{#if shell.agentOpen}
	<div class="scrim" transition:fade={{ duration: 160 }} onclick={() => (shell.agentOpen = false)} aria-hidden="true"></div>
	<aside class="panel" aria-label="Heroics assistant" transition:fly={{ x: 440, duration: 320, easing: cubicOut, opacity: 1 }}>
		<header>
			<div class="who">
				<span class="orb" aria-hidden="true"></span>
				<div>
					<h2>Heroics</h2>
					<p class="dim">Runs locally unless a grant allows cloud AI</p>
				</div>
			</div>
			<button class="icon-btn" onclick={() => (shell.agentOpen = false)} aria-label="Close assistant">
				<Icon name="x" />
			</button>
		</header>

		<div class="tabs" role="tablist">
			<button role="tab" aria-selected={tab === 'approvals'} class:on={tab === 'approvals'} onclick={() => (tab = 'approvals')}>
				Needs you {#if queue.items.length}<span class="num badge">{queue.items.length}</span>{/if}
			</button>
			<button role="tab" aria-selected={tab === 'chat'} class:on={tab === 'chat'} onclick={() => (tab = 'chat')}>Chat</button>
		</div>

		{#if tab === 'approvals'}
			<div class="scroll">
				{#each queue.items as a (a.id)}
					<article class="proposal" style:--hue={appHue(a.app)} animate:flip={{ duration: 300 }} out:slide={{ duration: 220 }}>
						<p class="app">{appName(a.app)}</p>
						<h3>{a.title}</h3>
						<p class="muted">{a.detail}</p>
						{#each a.diff as d, i (i)}
							<div class="diff">
								<span class="before">{d.before}</span>
								<span class="after">{d.after}</span>
							</div>
						{/each}
						<p class="why dim"><TierBadge tier={a.tier} /> <LabelBadge label={a.label} /> {a.why}</p>
						<div class="actions">
							<button class="btn btn-primary btn-sm" onclick={() => queue.resolve(a.id, true)}><Icon name="check" size={16} /> Approve</button>
							<button class="btn btn-ghost btn-sm" onclick={() => queue.resolve(a.id, false)}>Decline</button>
						</div>
					</article>
				{:else}
					<div class="empty">
						<Icon name="check" size={28} />
						<p>You’re all caught up. New proposals from your apps show up here before anything changes.</p>
					</div>
				{/each}
			</div>
		{:else}
			<div class="scroll log" bind:this={log}>
				{#each turns as t, i (i)}
					<div class="turn {t.role}" in:fly={{ y: 8, duration: 240 }}>
						{#if t.steps}
							<ul class="steps">
								{#each t.steps as s (s.tool)}
									<li><code>{s.tool}</code> <TierBadge tier={s.tier} /> <LabelBadge label={s.label} compact /></li>
								{/each}
							</ul>
						{/if}
						<p>{t.text}</p>
					</div>
				{/each}
				{#if thinking}
					<div class="turn agent thinking" aria-live="polite"><span></span><span></span><span></span><span class="sr-only">Thinking</span></div>
				{/if}
			</div>
			<form onsubmit={send}>
				<input bind:value={draft} placeholder="Ask about your training, money or projects" aria-label="Message Heroics" />
				<button class="send" aria-label="Send" disabled={!draft.trim()}><Icon name="send" size={18} /></button>
			</form>
		{/if}
	</aside>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 30;
		background: rgb(6 10 22 / 0.35);
	}
	.panel {
		position: fixed;
		z-index: 31;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(440px, 100vw);
		display: flex;
		flex-direction: column;
		background: color-mix(in oklab, var(--slate) 94%, transparent);
		border-left: 1px solid var(--line);
		backdrop-filter: blur(24px);
		box-shadow: -24px 0 60px -20px rgb(0 0 0 / 0.6);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--s-5) var(--s-5) var(--s-4);
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--s-3);
	}
	.who h2 {
		font-size: var(--t-lg);
	}
	.who p {
		font-size: var(--t-xs);
	}
	.orb {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: conic-gradient(from 200deg, var(--ember), var(--gold), var(--jade), var(--iris), var(--ember));
		box-shadow: 0 0 22px color-mix(in oklab, var(--gold) 45%, transparent);
		animation: spin 12s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(1turn);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.orb {
			animation: none;
		}
	}
	.tabs {
		display: flex;
		gap: var(--s-1);
		padding: 0 var(--s-5);
		border-bottom: 1px solid var(--line);
	}
	.tabs button {
		position: relative;
		height: 40px;
		padding: 0 var(--s-3);
		color: var(--mist);
		font-weight: 600;
		font-size: var(--t-sm);
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.tabs button.on {
		color: var(--paper);
	}
	.tabs button.on::after {
		content: '';
		position: absolute;
		left: 8px;
		right: 8px;
		bottom: -1px;
		height: 2px;
		border-radius: 2px;
		background: var(--gold);
	}
	.badge {
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: var(--r-pill);
		background: var(--gold);
		color: var(--night-deep);
		font-size: 11px;
		display: grid;
		place-items: center;
	}
	.scroll {
		flex: 1;
		overflow-y: auto;
		padding: var(--s-4) var(--s-5) var(--s-5);
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}
	.proposal {
		padding: var(--s-4);
		border-radius: var(--r-md);
		background: var(--night-deep);
		border: 1px solid var(--line);
		border-left: 3px solid var(--hue);
	}
	.proposal .app {
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--hue);
	}
	.proposal h3 {
		font-size: var(--t-md);
		margin: 2px 0 4px;
	}
	.proposal .muted {
		font-size: var(--t-sm);
	}
	.diff {
		margin-top: var(--s-3);
		display: grid;
		gap: 4px;
		font-size: var(--t-sm);
	}
	.before {
		color: var(--mist-dim);
		text-decoration: line-through;
		text-decoration-color: color-mix(in oklab, var(--bad) 60%, transparent);
	}
	.after {
		color: var(--paper);
	}
	.after::before {
		content: '+ ';
		color: var(--good);
		font-weight: 700;
	}
	.why {
		margin-top: var(--s-3);
		font-size: var(--t-xs);
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}
	.actions {
		margin-top: var(--s-4);
		display: flex;
		gap: var(--s-2);
	}
	.empty {
		margin: auto;
		text-align: center;
		color: var(--mist);
		display: grid;
		justify-items: center;
		gap: var(--s-3);
		max-width: 280px;
	}
	.empty :global(svg) {
		color: var(--good);
	}
	.turn {
		max-width: 92%;
		font-size: var(--t-sm);
	}
	.turn.user {
		align-self: flex-end;
		background: var(--slate-3);
		padding: var(--s-2) var(--s-3);
		border-radius: 14px 14px 4px 14px;
	}
	.turn.agent p {
		line-height: 1.6;
	}
	.steps {
		list-style: none;
		margin: 0 0 var(--s-2);
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.steps li {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	code {
		font-size: 11.5px;
		color: var(--mist);
		background: var(--night-deep);
		padding: 2px 6px;
		border-radius: 5px;
	}
	.thinking {
		display: flex;
		gap: 5px;
		padding: var(--s-2) 0;
	}
	.thinking span:not(.sr-only) {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--mist);
		animation: bounce 1s infinite var(--ease-out);
	}
	.thinking span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.thinking span:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes bounce {
		50% {
			transform: translateY(-5px);
			opacity: 0.5;
		}
	}
	form {
		display: flex;
		gap: var(--s-2);
		padding: var(--s-3) var(--s-5) calc(var(--s-5) + env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
	}
	form input {
		flex: 1;
		height: 42px;
		padding: 0 var(--s-4);
		border-radius: var(--r-pill);
		border: 1px solid var(--line-strong);
		background: var(--night-deep);
		outline: none;
	}
	form input:focus {
		border-color: var(--gold);
	}
	.send {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--gold);
		color: var(--night-deep);
		transition: opacity var(--dur-fast);
	}
	.send:disabled {
		opacity: 0.35;
		cursor: default;
	}
</style>
