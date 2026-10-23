const MIB = 1024 ** 2;
const GIB = 1024 ** 3;
const HISTORY_SECONDS = 3600;

const statsHistory = () => {
	const end = Math.floor(Date.now() / 1000) * 1000;
	return Array.from({ length: HISTORY_SECONDS }, (_, second) => {
		const wave = Math.sin(second / 90) + 0.6 * Math.sin(second / 23 + 1);
		const isBurst = (second >= 3240 && second <= 3330);
		return {
			time: end - ((HISTORY_SECONDS - 1 - second) * 1000),
			cpu: Math.round((12 + 6 * wave + (isBurst ? 55 : 0)) * 10) / 10,
			memory: Math.round((5.5 + 0.3 * Math.sin(second / 400)) * GIB),
			rx: Math.round((14 + 8 * wave + (isBurst ? 38 : 0)) * MIB),
			tx: Math.round((4 + 2.5 * Math.cos(second / 50) + (isBurst ? 6 : 0)) * MIB)
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
