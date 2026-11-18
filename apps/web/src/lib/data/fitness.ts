import { addDays, seeded, TODAY } from '$lib/format';

export const readiness = {
	score: 72,
	sleepMin: 408,
	hrvMs: 58,
	hrvBaseline: 64,
	restingHr: 54,
	note: 'HRV is 9% under your 30-day baseline, so today trims one working set from leg press.'
};

export interface PlannedExercise {
	id: string;
	name: string;
	muscle: string;
	sets: number;
	reps: string;
	rir: number;
	last: string;
	suggestion: string;
	trimmed?: boolean;
}

export const todayWorkout = {
	name: 'Lower A',
	week: 'Week 3 of 5 · strength block',
	start: '18:00',
	estimateMin: 64,
	exercises: [
		{ id: 'squat', name: 'Back squat', muscle: 'Quads', sets: 4, reps: '5–7', rir: 2, last: '110 kg × 6, 6, 5, 5', suggestion: '112.5 kg' },
		{ id: 'rdl', name: 'Romanian deadlift', muscle: 'Hamstrings', sets: 3, reps: '8–10', rir: 2, last: '100 kg × 10, 9, 9', suggestion: '102.5 kg' },
		{ id: 'press', name: 'Leg press', muscle: 'Quads', sets: 2, reps: '10–12', rir: 1, last: '200 kg × 12, 12, 11', suggestion: '200 kg', trimmed: true },
		{ id: 'lunge', name: 'Walking lunge', muscle: 'Glutes', sets: 2, reps: '12', rir: 2, last: '2 × 20 kg × 12', suggestion: '2 × 22 kg' },
		{ id: 'calf', name: 'Standing calf raise', muscle: 'Calves', sets: 3, reps: '12–15', rir: 1, last: '80 kg × 15, 14, 13', suggestion: '80 kg' }
	] satisfies PlannedExercise[]
};

export const macros = {
	kcal: { eaten: 1840, target: 2650 },
	protein: { eaten: 132, target: 180 },
	carbs: { eaten: 190, target: 300 },
	fat: { eaten: 58, target: 80 }
};

export const meals = [
	{ meal: 'Breakfast', time: '07:40', items: 'Overnight oats, whey, blueberries', kcal: 620, protein: 48 },
	{ meal: 'Lunch', time: '12:15', items: 'Chicken, rice, broccoli (meal prep)', kcal: 710, protein: 56 },
	{ meal: 'Snack', time: '15:30', items: 'Skyr, banana', kcal: 310, protein: 22 },
	{ meal: 'Snack', time: '16:45', items: 'Rice cakes, honey', kcal: 200, protein: 6 }
];

/** Weekly working sets per muscle vs. your target range. */
export const volume = [
	{ muscle: 'Chest', sets: 12, min: 10, max: 18 },
	{ muscle: 'Back', sets: 16, min: 12, max: 20 },
	{ muscle: 'Quads', sets: 9, min: 10, max: 16 },
	{ muscle: 'Hamstrings', sets: 8, min: 8, max: 14 },
	{ muscle: 'Glutes', sets: 7, min: 6, max: 12 },
	{ muscle: 'Shoulders', sets: 14, min: 10, max: 18 },
	{ muscle: 'Biceps', sets: 10, min: 8, max: 14 },
	{ muscle: 'Triceps', sets: 9, min: 8, max: 14 },
	{ muscle: 'Calves', sets: 4, min: 8, max: 12 }
];

export const prs = [
	{ lift: 'Bench press', e1rm: 102.5, delta: 2.5, date: '2026-11-14' },
	{ lift: 'Back squat', e1rm: 135, delta: 5, date: '2026-11-11' },
	{ lift: 'Deadlift', e1rm: 180, delta: 0, date: '2026-10-29' },
	{ lift: 'Overhead press', e1rm: 66, delta: 1.5, date: '2026-11-12' }
];

/** 90 days of weigh-ins with a smoothed trend (EMA). */
export const weight = (() => {
	const rnd = seeded(7);
	const out: { x: string; y: number; raw: number }[] = [];
	let trend = 85.4;
	for (let i = 89; i >= 0; i--) {
		const day = addDays(TODAY, -i);
		const base = 85.4 - (89 - i) * 0.036;
		const raw = +(base + (rnd() - 0.5) * 1.4).toFixed(1);
		trend = trend + 0.1 * (raw - trend);
		out.push({ x: day, y: +trend.toFixed(2), raw });
	}
	return out;
})();

export const weekSessions = [
	{ day: 'Mon', name: 'Upper A', done: true, volume: 14_820 },
	{ day: 'Tue', name: 'Rest', done: true, volume: 0 },
	{ day: 'Wed', name: 'Lower A', done: false, volume: 0 },
	{ day: 'Thu', name: 'Rest', done: false, volume: 0 },
	{ day: 'Fri', name: 'Upper B', done: false, volume: 0 },
	{ day: 'Sat', name: 'Lower B', done: false, volume: 0 },
	{ day: 'Sun', name: 'Rest', done: false, volume: 0 }
];

export const photoSessions = [
	{ date: '2026-08-20', poses: 3 },
	{ date: '2026-09-24', poses: 3 },
	{ date: '2026-10-22', poses: 3 },
	{ date: '2026-11-12', poses: 3 }
];

export const measurements = [
	{ name: 'Waist', value: '84.5 cm', change: '−2.5 cm', since: 'since Aug' },
	{ name: 'Chest', value: '104 cm', change: '±0', since: 'since Aug' },
	{ name: 'Arm', value: '38.5 cm', change: '+0.5 cm', since: 'since Aug' },
	{ name: 'Thigh', value: '61 cm', change: '+1 cm', since: 'since Aug' }
];
