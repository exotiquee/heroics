/**
 * Sensitivity labels. Every record, file and tool result carries exactly one.
 * Ordered from least to most sensitive.
 */
export const LABELS = ['open', 'personal', 'private', 'sealed'] as const;
export type Label = (typeof LABELS)[number];

/** Where a piece of work runs. */
export const TIERS = ['device', 'box', 'cloud'] as const;
export type Tier = (typeof TIERS)[number];

export function rank(label: Label): number {
	return LABELS.indexOf(label);
}

export function isLabel(value: unknown): value is Label {
	return typeof value === 'string' && (LABELS as readonly string[]).includes(value);
}

/** The more sensitive of two labels. */
export function maxLabel(a: Label, b: Label): Label {
	return rank(a) >= rank(b) ? a : b;
}

/** True when `label` is at most as sensitive as `ceiling`. */
export function atMost(label: Label, ceiling: Label): boolean {
	return rank(label) <= rank(ceiling);
}

/**
 * The most sensitive label each tier may ever process, before grants.
 * - device: your own phone, iPad or computer — anything, including sealed data.
 * - box: your household server — private data, never sealed (it only holds ciphertext).
 * - cloud: open data by default; personal data only with a grant (see router).
 */
export const TIER_CEILING: Record<Tier, Label> = {
	device: 'sealed',
	box: 'private',
	cloud: 'open'
};

/** Human copy for each label, used by the UI. */
export const LABEL_COPY: Record<Label, { name: string; rule: string }> = {
	open: { name: 'Open', rule: 'Any model may use this' },
	personal: { name: 'Personal', rule: 'Cloud AI only with your grant' },
	private: { name: 'Private', rule: 'Your devices and your server only' },
	sealed: { name: 'Sealed', rule: 'Never leaves your own devices' }
};
