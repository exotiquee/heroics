import { atMost, type Label } from './labels.ts';

/**
 * A grant lets cloud AI see data up to `maxLabel` within `scope`.
 * Scopes are dotted paths: `finance.monthly_totals`, `projects.p_123`.
 * A trailing `.*` covers everything below a prefix: `fitness.*`.
 * There is deliberately no global `*` grant.
 */
export interface Grant {
	id: string;
	scope: string;
	maxLabel: Label;
	purpose: string;
	createdAt: string;
	expiresAt: string | null;
	revokedAt: string | null;
}

const SCOPE_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*(\.\*)?$/;

export function isValidScope(scope: string): boolean {
	return SCOPE_RE.test(scope);
}

export function scopeCovers(grantScope: string, requested: string): boolean {
	if (!isValidScope(grantScope) || !isValidScope(requested) || requested.endsWith('.*')) return false;
	if (grantScope.endsWith('.*')) {
		const prefix = grantScope.slice(0, -2);
		return requested === prefix || requested.startsWith(prefix + '.');
	}
	return grantScope === requested;
}

export function isActive(grant: Grant, now: Date): boolean {
	if (grant.revokedAt && new Date(grant.revokedAt) <= now) return false;
	if (grant.expiresAt && new Date(grant.expiresAt) <= now) return false;
	return new Date(grant.createdAt) <= now;
}

/** The first active grant covering `scope` at `label`, or null. */
export function findGrant(grants: readonly Grant[], scope: string, label: Label, now: Date): Grant | null {
	return (
		grants.find((g) => isActive(g, now) && scopeCovers(g.scope, scope) && atMost(label, g.maxLabel)) ?? null
	);
}
