import type { Pathname } from '$app/types';
import type { IconName } from '@heroics/ui';

export type AppId = 'hq' | 'fitness' | 'finance' | 'projects';

export interface Section {
	href: Pathname;
	label: string;
	icon: IconName;
}

export interface AppDef {
	id: AppId;
	name: string;
	icon: IconName;
	hue: string;
	tagline: string;
	shortcut: string;
	sections: Section[];
}

export const APPS: AppDef[] = [
	{
		id: 'hq',
		name: 'HQ',
		icon: 'crest',
		hue: 'var(--gold)',
		tagline: 'Your day across every app',
		shortcut: '1',
		sections: [
			{ href: '/', label: 'Today', icon: 'home' },
			{ href: '/ledger', label: 'Privacy ledger', icon: 'shield' }
		]
	},
	{
		id: 'fitness',
		name: 'Fitness',
		icon: 'dumbbell',
		hue: 'var(--ember)',
		tagline: 'Training, food and recovery',
		shortcut: '2',
		sections: [
			{ href: '/fitness', label: 'Today', icon: 'flame' },
			{ href: '/fitness/workout', label: 'Workout', icon: 'dumbbell' },
			{ href: '/fitness/progress', label: 'Progress', icon: 'trend' },
			{ href: '/fitness/body', label: 'Body', icon: 'scale' },
			{ href: '/fitness/nutrition', label: 'Nutrition', icon: 'leaf' }
		]
	},
	{
		id: 'finance',
		name: 'Finance',
		icon: 'wallet',
		hue: 'var(--jade)',
		tagline: 'Money, bills and taxes',
		shortcut: '3',
		sections: [
			{ href: '/finance', label: 'Overview', icon: 'home' },
			{ href: '/finance/transactions', label: 'Transactions', icon: 'list' },
			{ href: '/finance/bills', label: 'Bills', icon: 'repeat' },
			{ href: '/finance/tax', label: 'Tax year', icon: 'file' },
			{ href: '/finance/vault', label: 'Vault', icon: 'lock' }
		]
	},
	{
		id: 'projects',
		name: 'Projects',
		icon: 'kanban',
		hue: 'var(--iris)',
		tagline: 'Plans, people and time',
		shortcut: '4',
		sections: [
			{ href: '/projects', label: 'Board', icon: 'kanban' },
			{ href: '/projects/week', label: 'My week', icon: 'calendar' },
			{ href: '/projects/time', label: 'Time & billing', icon: 'clock' }
		]
	}
];

export function appFor(pathname: string): AppDef {
	const seg = pathname.split('/')[1] ?? '';
	return APPS.find((a) => a.id === seg) ?? APPS[0]!;
}

export function isActive(sectionHref: string, pathname: string): boolean {
	const root = APPS.some((a) => a.sections[0]?.href === sectionHref);
	return root ? pathname === sectionHref : pathname === sectionHref || pathname.startsWith(sectionHref + '/');
}
