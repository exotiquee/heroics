import type { Label } from '@heroics/policy';
import type { AccountKind, TaxItemStatus } from '@heroics/schema';
import { addDays, seeded, TODAY } from '$lib/format';

export const accounts: { name: string; kind: AccountKind; balance: number; shared: boolean }[] = [
	{ name: 'Salary account', kind: 'bank', balance: 841_235, shared: false },
	{ name: 'Joint account', kind: 'bank', balance: 312_080, shared: true },
	{ name: 'Card', kind: 'card', balance: -64_012, shared: false },
	{ name: 'Pillar 3a', kind: 'pillar3a', balance: 2_488_000, shared: false },
	{ name: 'Brokerage', kind: 'investment', balance: 1_823_055, shared: false }
];

export const netWorth = (() => {
	const rnd = seeded(11);
	const out: number[] = [];
	let v = 4_820_000;
	for (let i = 0; i < 24; i++) {
		v += 18_000 + (rnd() - 0.35) * 60_000;
		out.push(Math.round(v));
	}
	return out;
})();

export const month = {
	name: 'November',
	income: 742_000,
	spent: 461_820,
	dayOfMonth: 18,
	daysInMonth: 30
};

export const budgets = [
	{ category: 'Groceries', spent: 61_240, limit: 80_000 },
	{ category: 'Eating out', spent: 21_450, limit: 25_000 },
	{ category: 'Transport', spent: 14_800, limit: 20_000 },
	{ category: 'Fun', spent: 31_020, limit: 25_000 },
	{ category: 'Home', spent: 9_540, limit: 15_000 },
	{ category: 'Health', spent: 12_000, limit: 30_000 }
];

export interface Tx {
	id: string;
	date: string;
	counterparty: string;
	memo: string;
	category: string;
	amount: number;
	account: string;
	label: Label;
	review?: { suggestion: string; confidence: number };
	receipt?: boolean;
	tax?: string;
}

export const transactions: Tx[] = [
	{ id: 't1', date: '2026-11-18', counterparty: 'Migros', memo: 'Winterthur Bahnhof', category: 'Groceries', amount: -4_385, account: 'Joint account', label: 'private', receipt: true },
	{ id: 't2', date: '2026-11-17', counterparty: 'Digitec Galaxus', memo: 'Monitor 27"', category: 'Work equipment', amount: -38_900, account: 'Card', label: 'private', receipt: true, tax: 'Work equipment' },
	{ id: 't3', date: '2026-11-17', counterparty: 'Unknown merchant', memo: 'SumUp *Kiosk Lind', category: 'Uncategorised', amount: -1_250, account: 'Card', label: 'private', review: { suggestion: 'Eating out', confidence: 0.62 } },
	{ id: 't4', date: '2026-11-16', counterparty: 'SBB', memo: 'Zurich HB – Bern', category: 'Transport', amount: -5_600, account: 'Card', label: 'private', review: { suggestion: 'Transport', confidence: 0.81 } },
	{ id: 't5', date: '2026-11-15', counterparty: 'Coop', memo: 'Coop City', category: 'Groceries', amount: -6_710, account: 'Joint account', label: 'private' },
	{ id: 't6', date: '2026-11-14', counterparty: 'TWINT · Lea', memo: 'Dinner split', category: 'Transfer', amount: 4_200, account: 'Salary account', label: 'private', review: { suggestion: 'Settle-up', confidence: 0.74 } },
	{ id: 't7', date: '2026-11-13', counterparty: 'Dr. med. dent. Keller', memo: 'QR-bill 2026-1104', category: 'Health', amount: -18_500, account: 'Salary account', label: 'private', receipt: true, tax: 'Medical costs' },
	{ id: 't8', date: '2026-11-12', counterparty: 'Galaxus', memo: 'Order 88412', category: 'Uncategorised', amount: -2_990, account: 'Card', label: 'private', review: { suggestion: 'Home', confidence: 0.48 } },
	{ id: 't9', date: '2026-11-10', counterparty: 'Alpine Dental AG', memo: 'Invoice H-2026-014', category: 'Freelance income', amount: 342_000, account: 'Salary account', label: 'private' },
	{ id: 't10', date: '2026-11-08', counterparty: 'Spotify', memo: 'Family plan', category: 'Subscriptions', amount: -1_295, account: 'Card', label: 'private' },
	{ id: 't11', date: '2026-11-05', counterparty: 'Employer AG', memo: 'Salary November', category: 'Salary', amount: 742_000, account: 'Salary account', label: 'private' },
	{ id: 't12', date: '2026-11-03', counterparty: 'VIAC', memo: 'Pillar 3a contribution', category: 'Pillar 3a', amount: -60_000, account: 'Salary account', label: 'private', tax: 'Pillar 3a' }
];

export const bills = [
	{ name: 'Swisscom', amount: 6_900, due: addDays(TODAY, 7), kind: 'eBill', change: 500 },
	{ name: 'Health insurance', amount: 41_260, due: '2026-11-30', kind: 'QR-bill' },
	{ name: 'Rent', amount: 195_000, due: '2026-12-01', kind: 'Standing order' },
	{ name: 'Serafe', amount: 33_500, due: '2026-12-15', kind: 'QR-bill' },
	{ name: 'Car insurance', amount: 74_380, due: '2027-01-02', kind: 'QR-bill' }
];

export const subscriptions = [
	{ name: 'Spotify Family', monthly: 1_295, lastUsed: 'today', unused: false },
	{ name: 'Netflix Standard', monthly: 1_890, lastUsed: '74 days ago', unused: true },
	{ name: 'iCloud+ 200 GB', monthly: 400, lastUsed: 'today', unused: false },
	{ name: 'Gym membership', monthly: 8_900, lastUsed: 'Monday', unused: false },
	{ name: 'News subscription', monthly: 2_400, lastUsed: '41 days ago', unused: true }
];

export interface TaxRow {
	section: string;
	title: string;
	status: TaxItemStatus;
	evidence: string;
	auto?: boolean;
}

export const taxYear = 2026;
export const taxItems: TaxRow[] = [
	{ section: 'Income', title: 'Salary certificate (Lohnausweis)', status: 'missing', evidence: 'Arrives from your employer in January' },
	{ section: 'Income', title: 'Freelance income', status: 'complete', evidence: '4 invoices, matched to bank payments', auto: true },
	{ section: 'Assets', title: 'Bank year-end statements', status: 'partial', evidence: '1 of 3 accounts so far' },
	{ section: 'Deductions', title: 'Pillar 3a contributions', status: 'complete', evidence: 'VIAC confirmation in Vault', auto: true },
	{ section: 'Deductions', title: 'Health insurance premiums', status: 'complete', evidence: '11 of 12 premiums matched', auto: true },
	{ section: 'Deductions', title: 'Commuting', status: 'complete', evidence: 'SBB travelcard, receipt attached', auto: true },
	{ section: 'Deductions', title: 'Work equipment', status: 'partial', evidence: 'Monitor CHF 389.00 is a candidate; confirm it' },
	{ section: 'Deductions', title: 'Further education', status: 'complete', evidence: 'Course invoice CHF 1’200.00', auto: true },
	{ section: 'Deductions', title: 'Medical costs', status: 'partial', evidence: 'Dentist CHF 185.00 and 3 pharmacy receipts' },
	{ section: 'Deductions', title: 'Donations', status: 'missing', evidence: 'No donation receipts yet this year' },
	{ section: 'Deductions', title: 'Childcare', status: 'not_applicable', evidence: 'Not relevant for your household' }
];

export const vault = [
	{ name: 'Rental contract', kind: 'Contract', expires: null, added: '2024-03-01' },
	{ name: 'Household insurance', kind: 'Insurance', expires: '2027-03-31', added: '2025-03-28' },
	{ name: 'Passport', kind: 'ID', expires: '2027-01-14', added: '2022-01-14' },
	{ name: 'MacBook warranty', kind: 'Warranty', expires: '2026-12-09', added: '2024-12-09' },
	{ name: 'Pillar 3a confirmation 2026', kind: 'Tax', expires: null, added: '2026-11-03' },
	{ name: 'Salary certificate 2025', kind: 'Tax', expires: null, added: '2026-01-21' }
];
