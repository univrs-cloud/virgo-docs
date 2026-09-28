const status = () => {
	return {
		cpuStats: { currentLoad: 12, temperature: { main: 41 } },
		memory: { total: 15.8 * 1024 ** 3, available: 10.3 * 1024 ** 3 },
		networkStats: { iface: 'bond0', rx_sec: 1.8 * 1024 ** 2, tx_sec: 0.4 * 1024 ** 2 },
		time: { uptime: 5 * 86400 + 7 * 3600 },
		ups: { powerSource: 'grid', capacity: 100, isCharging: false }
	};
};

const INDEXER_RUN_AGO_MS = 20 * 60 * 1000;

const indexerStats = (now) => {
	return {
		lastRunAt: new Date(now - INDEXER_RUN_AGO_MS).toISOString(),
		dbBytes: 412 * 1024 ** 2,
		datasets: 18,
		snapshots: 142,
		indexed: 142,
		files: 186420,
		versions: 241907,
		deleted: 3184,
		changes: 58306,
		changeTypes: { added: 31240, modified: 22915, renamed: 967, removed: 3184 },
		lastRun: {}
	};
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
	indexerStats,
	networkHistory
};
