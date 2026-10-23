const KIB = 1024;
const MIB = 1024 ** 2;
const GIB = 1024 ** 3;
const HISTORY_SECONDS = 3600;
const COPY = { from: 500, to: 380 };
const JOB = { from: 210, to: 150 };
const EARLIER_COPY = { from: 2100, to: 1920 };
const BACKUP = { from: 60, to: 0 };

const random = (seed) => {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
};

const isWithin = (secondsAgo, { from, to }) => {
	return secondsAgo <= from && secondsAgo >= to;
};

const statsHistory = () => {
	const next = random(42);
	const end = Math.floor(Date.now() / 1000) * 1000;
	let spike = 0;
	return Array.from({ length: HISTORY_SECONDS }, (_, second) => {
		const secondsAgo = HISTORY_SECONDS - 1 - second;
		const isCopying = isWithin(secondsAgo, COPY);
		const isUploading = isWithin(secondsAgo, EARLIER_COPY);
		const isWorking = isWithin(secondsAgo, JOB);
		const isBackingUp = isWithin(secondsAgo, BACKUP);
		if (spike === 0 && next() < 0.015) {
			spike = 1 + Math.floor(next() * 3);
		}

		const spikeLoad = (spike > 0 && !isWorking ? 22 + (next() * 40) : 0);
		spike = Math.max(spike - 1, 0);
		const baseLoad = 9 + (2 * Math.sin(second / 420)) + (next() * 7) + (next() < 0.15 ? next() * 12 : 0);
		const transferLoad = ((isCopying || isUploading || isBackingUp) ? 8 + (next() * 6) : 0);
		const jobLoad = (isWorking ? 30 + (next() * 12) : 0);
		const memory = 7.5 + (0.05 * Math.sin(second / 900)) + (next() * 0.02) + (isWorking ? 0.3 : 0);
		const transfer = 52 + (next() * 14) - (next() * next() * 18);
		return {
			time: end - (secondsAgo * 1000),
			cpu: Math.round(Math.min(baseLoad + transferLoad + jobLoad + spikeLoad, 100) * 10) / 10,
			memory: Math.round(memory * GIB),
			rx: Math.round(isUploading ? transfer * MIB : (isBackingUp ? (15.2 + (next() * 1.6)) * MIB : ((18 + (next() * 50)) * KIB) + (isCopying ? (0.8 + next() * 0.6) * MIB : 0))),
			tx: Math.round(isCopying ? transfer * MIB : (isBackingUp ? (8.8 + (next() * 1.2)) * MIB : ((9 + (next() * 30)) * KIB) + (isUploading ? (0.7 + next() * 0.5) * MIB : 0)))
		};
	});
};

const status = () => {
	return {
		cpuStats: { temperature: { main: 41 }, fan: '2460' },
		memory: { total: 15.8 * 1024 ** 3 },
		stats: statsHistory(),
		time: { uptime: 5 * 86400 + 7 * 3600 },
		ups: { powerSource: 'grid', capacity: 100, isCharging: false }
	};
};

const upsCharging = () => {
	return { powerSource: 'grid', capacity: 86, isCharging: true };
};

const upsOnBattery = () => {
	return { powerSource: 'battery', capacity: 72, isCharging: false };
};

const upsMissing = () => {
	return { batteryCharge: false, error: 'No UPS found' };
};

const upsUnreachable = () => {
	return { error: 'unreachable', message: 'connect ENOENT /var/run/virgo-ups.sock' };
};

const upsFailed = () => {
	return { error: 'invalid', message: 'Unexpected end of JSON input' };
};

export {
	status,
	upsCharging,
	upsOnBattery,
	upsMissing,
	upsUnreachable,
	upsFailed
};
