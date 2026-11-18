import { describe, expect, it } from 'vitest';
import {
	atMost,
	findGrant,
	maxLabel,
	permits,
	redact,
	restore,
	route,
	scopeCovers,
	Taint,
	type Grant
} from './index.ts';

const now = new Date('2026-11-18T12:00:00Z');

const grant = (over: Partial<Grant> = {}): Grant => ({
	id: 'g1',
	scope: 'finance.monthly_totals',
	maxLabel: 'personal',
	purpose: 'Weekly review',
	createdAt: '2026-11-01T00:00:00Z',
	expiresAt: '2027-02-01T00:00:00Z',
	revokedAt: null,
	...over
});

describe('labels', () => {
	it('orders labels from open to sealed', () => {
		expect(maxLabel('open', 'private')).toBe('private');
		expect(maxLabel('sealed', 'personal')).toBe('sealed');
		expect(atMost('personal', 'private')).toBe(true);
		expect(atMost('sealed', 'private')).toBe(false);
	});
});

describe('scopes', () => {
	it('matches exact scopes and prefix wildcards only', () => {
		expect(scopeCovers('finance.monthly_totals', 'finance.monthly_totals')).toBe(true);
		expect(scopeCovers('finance.*', 'finance.monthly_totals')).toBe(true);
		expect(scopeCovers('finance.*', 'finance')).toBe(true);
		expect(scopeCovers('finance.*', 'financeX.totals')).toBe(false);
		expect(scopeCovers('finance.monthly_totals', 'finance.transactions')).toBe(false);
	});
	it('rejects global and malformed scopes', () => {
		expect(scopeCovers('*', 'finance.monthly_totals')).toBe(false);
		expect(scopeCovers('Finance.*', 'Finance.x')).toBe(false);
		expect(scopeCovers('finance.*', 'finance.*')).toBe(false);
	});
});

describe('grants', () => {
	it('ignores expired, revoked and future grants', () => {
		expect(findGrant([grant()], 'finance.monthly_totals', 'personal', now)?.id).toBe('g1');
		expect(findGrant([grant({ expiresAt: '2026-11-10T00:00:00Z' })], 'finance.monthly_totals', 'personal', now)).toBeNull();
		expect(findGrant([grant({ revokedAt: '2026-11-17T00:00:00Z' })], 'finance.monthly_totals', 'personal', now)).toBeNull();
		expect(findGrant([grant({ createdAt: '2026-12-01T00:00:00Z' })], 'finance.monthly_totals', 'personal', now)).toBeNull();
	});
	it('never lets a grant reach above its own label', () => {
		expect(findGrant([grant()], 'finance.monthly_totals', 'private', now)).toBeNull();
	});
});

describe('permits', () => {
	it('keeps sealed data on the device', () => {
		expect(permits('device', 'sealed', 'fitness.photos', [], now).allowed).toBe(true);
		expect(permits('box', 'sealed', 'fitness.photos', [], now).allowed).toBe(false);
		expect(permits('cloud', 'sealed', 'fitness.photos', [grant({ scope: 'fitness.*', maxLabel: 'sealed' })], now).allowed).toBe(false);
	});
	it('never sends private data to the cloud, even with a grant', () => {
		const g = grant({ scope: 'finance.*', maxLabel: 'private' });
		expect(permits('cloud', 'private', 'finance.transactions', [g], now).allowed).toBe(false);
	});
	it('allows personal data in the cloud only with a matching grant', () => {
		expect(permits('cloud', 'personal', 'finance.monthly_totals', [], now).allowed).toBe(false);
		expect(permits('cloud', 'personal', 'finance.monthly_totals', [grant()], now)).toEqual({ allowed: true, grantId: 'g1' });
	});
});

describe('route', () => {
	const base = { scope: 'finance.monthly_totals', grants: [grant()], now };

	it('uses the cloud for granted personal facts', () => {
		const d = route({ ...base, label: 'personal', preferred: 'cloud', available: ['device', 'box', 'cloud'] });
		expect(d).toMatchObject({ ok: true, tier: 'cloud', grantId: 'g1' });
	});
	it('downgrades private work to the server, never up', () => {
		const d = route({ ...base, label: 'private', preferred: 'cloud', available: ['device', 'box', 'cloud'] });
		expect(d).toMatchObject({ ok: true, tier: 'box', grantId: null });
	});
	it('never escalates above the preferred tier', () => {
		const d = route({ ...base, label: 'open', preferred: 'box', available: ['cloud'] });
		expect(d.ok).toBe(false);
	});
	it('refuses instead of silently using the cloud when no local tier exists', () => {
		const d = route({ ...base, label: 'private', preferred: 'cloud', available: ['cloud'] });
		expect(d).toMatchObject({ ok: false, tier: null });
	});
	it('runs sealed work only on the device', () => {
		expect(route({ ...base, label: 'sealed', preferred: 'cloud', available: ['device', 'box', 'cloud'] })).toMatchObject({ tier: 'device' });
		expect(route({ ...base, label: 'sealed', preferred: 'cloud', available: ['box', 'cloud'] }).reason).toMatch(/own devices/);
	});
});

describe('taint', () => {
	it('only ever rises', () => {
		const t = new Taint();
		t.observe('personal', 'finance.get_budget_status');
		t.observe('private', 'finance.get_spending');
		t.observe('open', 'fitness.exercise_catalog');
		expect(t.level).toBe('private');
		expect(t.history).toHaveLength(3);
	});
	it('blocks a cloud route after the run reads private data', () => {
		const t = new Taint();
		t.observe('private', 'projects.notes');
		const d = route({ label: t.level, scope: 'projects.notes', preferred: 'cloud', available: ['device', 'box', 'cloud'], grants: [grant({ scope: 'projects.*' })], now });
		expect(d.tier).not.toBe('cloud');
	});
});

describe('redact', () => {
	it('replaces IBANs, AHV numbers, emails, phones and names, and restores them', () => {
		const input =
			'Pay CH93 0076 2011 6238 5295 7 for Anna Muster (anna@example.ch, +41 79 123 45 67), AHV 756.1234.5678.97. Anna agreed.';
		const { text, map } = redact(input, ['Anna Muster', 'Anna']);
		expect(text).not.toMatch(/CH93|anna@|756\.|79 123|Muster/);
		expect(text).toContain('⟦IBAN_1⟧');
		expect(text).toContain('⟦NAME_1⟧');
		expect(text).toContain('⟦NAME_2⟧ agreed');
		expect(restore(text, map)).toBe(input);
	});
	it('does not replace names inside other words', () => {
		const { text } = redact('Annabelle met Ann', ['Ann']);
		expect(text).toBe('Annabelle met ⟦NAME_1⟧');
	});
	it('reuses a placeholder for repeated values', () => {
		const { text } = redact('a@b.ch and a@b.ch');
		expect(text).toBe('⟦EMAIL_1⟧ and ⟦EMAIL_1⟧');
	});
});
