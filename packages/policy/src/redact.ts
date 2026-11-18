/**
 * Replaces identifying details with stable placeholders before text crosses
 * the cloud gate, and swaps them back locally afterwards.
 */
export interface Redaction {
	text: string;
	/** placeholder → original */
	map: Record<string, string>;
}

interface Pattern {
	kind: string;
	re: RegExp;
}

// Order matters: longer, more specific patterns first.
const PATTERNS: Pattern[] = [
	{ kind: 'IBAN', re: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g },
	{ kind: 'AHV', re: /\b756\.\d{4}\.\d{4}\.\d{2}\b/g },
	{ kind: 'EMAIL', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
	{ kind: 'PHONE', re: /(?:\+41|0041|\b0)\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b/g }
];

export function redact(input: string, names: readonly string[] = []): Redaction {
	const map: Record<string, string> = {};
	const reverse = new Map<string, string>();
	const counters: Record<string, number> = {};

	const placeholder = (kind: string, original: string) => {
		const existing = reverse.get(original);
		if (existing) return existing;
		counters[kind] = (counters[kind] ?? 0) + 1;
		const key = `⟦${kind}_${counters[kind]}⟧`;
		map[key] = original;
		reverse.set(original, key);
		return key;
	};

	let text = input;
	for (const { kind, re } of PATTERNS) {
		text = text.replace(re, (m) => placeholder(kind, m));
	}
	const sortedNames = [...names].filter((n) => n.trim().length > 1).sort((a, b) => b.length - a.length);
	for (const name of sortedNames) {
		const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, 'gu');
		text = text.replace(re, (m) => placeholder('NAME', m));
	}
	return { text, map };
}

export function restore(text: string, map: Record<string, string>): string {
	return text.replace(/⟦[A-Z]+_\d+⟧/g, (key) => map[key] ?? key);
}

function escapeRe(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
