const status = () => {
	return {
		cpuStats: { currentLoad: 12, temperature: { main: 41 } },
		memory: { total: 15.8 * 1024 ** 3, available: 10.3 * 1024 ** 3 },
		networkStats: { iface: 'bond0', rx_sec: 1.8 * 1024 ** 2, tx_sec: 0.4 * 1024 ** 2 },
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

const MIB = 1024 ** 2;
const HISTORY_SECONDS = 61;

const networkHistory = () => {
	return Array.from({ length: HISTORY_SECONDS }, (_, second) => {
		const wave = Math.sin(second / 6) + 0.6 * Math.sin(second / 2.3 + 1);
		const burst = (second >= 38 && second <= 47 ? 38 * MIB : 0);
		return {
			iface: 'bond0',
			rx_sec: Math.round((14 + 8 * wave) * MIB + burst),
			tx_sec: Math.round((4 + 2.5 * Math.cos(second / 5)) * MIB + burst / 6)
		};
	});
};

export {
	status,
	upsCharging,
	upsOnBattery,
	upsMissing,
	upsUnreachable,
	upsFailed,
	networkHistory
};
