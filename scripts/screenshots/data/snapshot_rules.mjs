const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ALL_DAYS = [...WEEKDAYS, 'saturday', 'sunday'];

const DEFAULT_RULE = 'production';
const OFFICE_RULE = 'Office hours';

const RULES = [
	{ name: DEFAULT_RULE, retention: { frequently: 0, hourly: 36, daily: 30, weekly: 0, monthly: 60, yearly: 5 }, keep: { frequently: { amount: 0, unit: 'hours' }, hourly: { amount: 36, unit: 'hours' }, daily: { amount: 30, unit: 'days' }, weekly: { amount: 0, unit: 'weeks' }, monthly: { amount: 5, unit: 'years' }, yearly: { amount: 5, unit: 'years' } }, schedule: { days: ALL_DAYS, from: 0, to: 24 }, isUsed: true, isDefault: true },
	{ name: OFFICE_RULE, retention: { frequently: 3, hourly: 11, daily: 22, weekly: 0, monthly: 12, yearly: 0 }, keep: { frequently: { amount: 2, unit: 'hours' }, hourly: { amount: 36, unit: 'hours' }, daily: { amount: 30, unit: 'days' }, weekly: { amount: 0, unit: 'weeks' }, monthly: { amount: 1, unit: 'years' }, yearly: { amount: 0, unit: 'years' } }, schedule: { days: WEEKDAYS, from: 9, to: 19 }, isUsed: true, isDefault: false }
];

const rules = () => {
	return structuredClone(RULES);
};

export {
	DEFAULT_RULE,
	OFFICE_RULE,
	rules
};
