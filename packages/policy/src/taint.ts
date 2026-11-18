import { maxLabel, type Label } from './labels.ts';

/**
 * Tracks the most sensitive label an agent run has seen.
 * Taint only ever rises: once a run reads private data, it stays private
 * for the rest of its life, so it can never be handed to a cloud model.
 */
export class Taint {
	#level: Label;
	readonly #seen: { label: Label; source: string }[] = [];

	constructor(initial: Label = 'open') {
		this.#level = initial;
	}

	get level(): Label {
		return this.#level;
	}

	get history(): readonly { label: Label; source: string }[] {
		return this.#seen;
	}

	observe(label: Label, source: string): Label {
		this.#seen.push({ label, source });
		this.#level = maxLabel(this.#level, label);
		return this.#level;
	}
}
