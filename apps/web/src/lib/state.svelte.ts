import { approvals as seedApprovals, type Approval } from '$lib/data/agent';

/** Shell UI state shared across the suite. */
class Shell {
	paletteOpen = $state(false);
	agentOpen = $state(false);
	navOpen = $state(false);
}
export const shell = new Shell();

/** Approval queue: agent proposals waiting for a yes or no. */
class Queue {
	items = $state<Approval[]>([...seedApprovals]);

	resolve(id: string, approved: boolean) {
		const item = this.items.find((a) => a.id === id);
		if (!item) return;
		this.items = this.items.filter((a) => a.id !== id);
		toast(approved ? `Approved: ${item.title}` : `Declined: ${item.title}`, approved ? 'Undo' : undefined, () => {
			this.items = [item, ...this.items];
		});
	}
}
export const queue = new Queue();

export interface Toast {
	id: number;
	text: string;
	action?: string;
	run?: () => void;
}

class Toasts {
	items = $state<Toast[]>([]);
}
export const toasts = new Toasts();

let nextId = 1;
export function toast(text: string, action?: string, run?: () => void) {
	const id = nextId++;
	toasts.items = [...toasts.items, { id, text, action, run }];
	setTimeout(() => dismiss(id), 5000);
}

export function dismiss(id: number) {
	toasts.items = toasts.items.filter((t) => t.id !== id);
}
