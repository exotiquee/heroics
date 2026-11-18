/** The preview runs on a fixed "today" so every screen tells the same story. */
export const TODAY = '2026-11-18';

const chfFmt = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' });
const chfWhole = new Intl.NumberFormat('de-CH', {
	style: 'currency',
	currency: 'CHF',
	maximumFractionDigits: 0,
	minimumFractionDigits: 0
});
const plain = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 1 });

/** Format integer minor units (Rappen) as CHF. */
export function chf(minor: number, opts: { whole?: boolean; sign?: boolean } = {}): string {
	const value = minor / 100;
	const s = (opts.whole ? chfWhole : chfFmt).format(Math.abs(value));
	if (opts.sign) return (value < 0 ? '−' : '+') + ' ' + s;
	return value < 0 ? '−' + s : s;
}

export function num(n: number): string {
	return plain.format(n);
}

export function kg(n: number): string {
	return `${plain.format(n)} kg`;
}

function parse(iso: string) {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(y!, m! - 1, d!));
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' });

export const fmtDay = (iso: string) => dayFmt.format(parse(iso));
export const fmtShort = (iso: string) => shortFmt.format(parse(iso));
export const fmtWeekday = (iso: string) => weekdayFmt.format(parse(iso));

export function daysBetween(a: string, b: string): number {
	return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

export function addDays(iso: string, n: number): string {
	const d = parse(iso);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** "today", "tomorrow", "in 5 days", "3 days ago" relative to TODAY. */
export function relDay(iso: string): string {
	const n = daysBetween(TODAY, iso);
	if (n === 0) return 'today';
	if (n === 1) return 'tomorrow';
	if (n === -1) return 'yesterday';
	return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

export function minutes(m: number): string {
	const h = Math.floor(m / 60);
	const r = m % 60;
	return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
}

/** Small deterministic PRNG so mock series look organic but never change between loads. */
export function seeded(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}
