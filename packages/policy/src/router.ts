import { findGrant, type Grant } from './grants.ts';
import { atMost, rank, TIER_CEILING, TIERS, type Label, type Tier } from './labels.ts';

export interface RouteRequest {
	/** The most sensitive label the run has seen (its taint). */
	label: Label;
	/** What the run is about, e.g. `finance.monthly_totals`. */
	scope: string;
	/** The tier the caller would like; the router never goes above it. */
	preferred: Tier;
	/** Tiers reachable right now (no box configured → no `box`). */
	available: readonly Tier[];
	grants: readonly Grant[];
	now: Date;
}

export type RouteDecision =
	| { ok: true; tier: Tier; grantId: string | null; reason: string }
	| { ok: false; tier: null; grantId: null; reason: string };

/** May `tier` process data labelled `label` within `scope`? Returns the grant used, if any. */
export function permits(
	tier: Tier,
	label: Label,
	scope: string,
	grants: readonly Grant[],
	now: Date
): { allowed: boolean; grantId: string | null } {
	if (atMost(label, TIER_CEILING[tier])) return { allowed: true, grantId: null };
	// Only the cloud tier can be widened, and only up to `personal`.
	if (tier === 'cloud' && label === 'personal') {
		const grant = findGrant(grants, scope, label, now);
		if (grant) return { allowed: true, grantId: grant.id };
	}
	return { allowed: false, grantId: null };
}

/**
 * Pick where a run executes. Rules:
 * 1. Never above the preferred tier.
 * 2. Never a tier the label forbids.
 * 3. Downgrade toward the device if needed; never escalate silently.
 * 4. If nothing allowed is available, refuse — the feature becomes manual.
 */
export function route(req: RouteRequest): RouteDecision {
	const candidates = TIERS.slice(0, TIERS.indexOf(req.preferred) + 1).reverse();
	for (const tier of candidates) {
		if (!req.available.includes(tier)) continue;
		const { allowed, grantId } = permits(tier, req.label, req.scope, req.grants, req.now);
		if (allowed) {
			const downgraded = tier !== req.preferred;
			return {
				ok: true,
				tier,
				grantId,
				reason: grantId
					? `Cloud allowed by grant ${grantId}`
					: downgraded
						? `${cap(req.label)} data stays on ${tierName(tier)}`
						: `Runs on ${tierName(tier)}`
			};
		}
	}
	return {
		ok: false,
		tier: null,
		grantId: null,
		reason:
			rank(req.label) >= rank('sealed') && !req.available.includes('device')
				? 'Sealed data needs one of your own devices'
				: 'No allowed place to run this; do it by hand or connect your server'
	};
}

function cap(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function tierName(tier: Tier) {
	return tier === 'device' ? 'this device' : tier === 'box' ? 'your server' : 'cloud AI';
}
