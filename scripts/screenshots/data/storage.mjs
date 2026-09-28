const DRIVE_SIZE = 2048408248320;
const DRIVE_MODEL = 'KINGSTON SKC3000D2048G';
const SYSTEM_DRIVE_SIZE = 15523119104;

const REPLACEMENT_SERIAL = 3;

const driveId = (serial) => {
	return `nvme-eui.0000000000000000000000000000000${serial}`;
};

const drives = ({ isReplaced = false } = {}) => {
	const data = ['nvme1n1', 'nvme0n1'].map((name, index) => {
		const serial = ((isReplaced && name === 'nvme0n1') ? REPLACEMENT_SERIAL : index + 1);
		const serialNumber = `EXAMPLE000000${serial}`;
		const eui = driveId(serial);
		return {
			name,
			path: `/dev/${name}`,
			id: eui,
			ids: [`nvme-${DRIVE_MODEL.replace(' ', '_')}_${serialNumber}`, eui],
			model: DRIVE_MODEL,
			serialNumber,
			size: DRIVE_SIZE,
			capacity: { bytes: DRIVE_SIZE },
			temperature: 25 + index,
			temperatureWarningThreshold: 84,
			temperatureCriticalThreshold: 89,
			health: { status: 'ok', problems: [], message: null }
		};
	});
	return [...data, {
		name: 'mmcblk0',
		path: '/dev/mmcblk0',
		system: true,
		model: null,
		serialNumber: '0x00000000',
		size: SYSTEM_DRIVE_SIZE,
		capacity: { bytes: SYSTEM_DRIVE_SIZE },
		health: { status: 'unsupported', problems: [], message: null }
	}];
};

const SNAPSHOTS_SHARE = 0.18;
const COMPRESS_RATIO = 1.34;
const POOL_GUID = '8214936017724519083';

const properties = (size, usedPercent, health = 'ONLINE') => {
	const allocated = Math.round(size * usedPercent / 100);
	const snapshots = Math.round(allocated * SNAPSHOTS_SHARE);
	return {
		health: { value: health },
		size: { value: size },
		allocated: { value: allocated },
		free: { value: size - allocated },
		capacity: { value: usedPercent },
		usedbydatasets: { value: allocated - snapshots },
		usedbysnapshots: { value: snapshots },
		compressratio: { value: COMPRESS_RATIO },
		savedbycompression: { value: Math.round(allocated * (COMPRESS_RATIO - 1)) }
	};
};

const scrubFinished = (now, size) => {
	const endTime = Math.floor(now / 1000) - 3 * 86400;
	return { function: 'SCRUB', state: 'FINISHED', startTime: endTime - 1260, endTime, toExamine: size, examined: size, issued: size, processed: 0, errors: 0 };
};

const resilverRunning = (now, size) => {
	const startTime = Math.floor(now / 1000) - 780;
	const issued = Math.round(size * 0.34 * 0.61);
	return { function: 'RESILVER', state: 'SCANNING', startTime, passStart: startTime, endTime: 0, toExamine: Math.round(size * 0.34), examined: Math.round(size * 0.34 * 0.66), issued, processed: issued, errors: 0, scrubPause: 0, scrubSpentPaused: 0, issuedBytesPerScan: 0 };
};

const scrubRunning = (now, size) => {
	const startTime = Math.floor(now / 1000) - 540;
	const issued = Math.round(size * 0.42);
	return { function: 'SCRUB', state: 'SCANNING', startTime, passStart: startTime, endTime: 0, toExamine: size, examined: Math.round(size * 0.47), issued, processed: 0, errors: 0, scrubPause: 0, scrubSpentPaused: 0, issuedBytesPerScan: 0 };
};

const snapshots = (count) => {
	return Object.fromEntries(Array.from({ length: count }, (_, index) => {
		const name = `messier/apps@autosnap_${String(index).padStart(3, '0')}`;
		return [name, { name, pool: 'messier' }];
	}));
};

const systemPool = () => {
	return { name: 'system', properties: properties(14.4 * 1024 ** 3, 27) };
};

const disk = (drive, state, extra = {}) => {
	return { name: drive.id, vdevType: 'disk', state, physSpace: drive.size, readErrors: 0, writeErrors: 0, checksumErrors: 0, ...extra };
};

const dataPool = (members, topology, usedPercent, { now = null, scan = null, missingDrive = null, replacedDrive = null } = {}) => {
	const disks = members.filter((drive) => { return !drive.system; });
	const isDegraded = Boolean(missingDrive || replacedDrive);
	const groups = {};
	for (let index = 0; index < disks.length; index += topology.width) {
		const name = `${topology.type}-${index / topology.width}`;
		groups[name] = {
			name,
			vdevType: topology.type,
			state: (isDegraded ? 'DEGRADED' : 'ONLINE'),
			totalSpace: topology.usableBytes,
			vdevs: Object.fromEntries(disks.slice(index, index + topology.width).map((drive, position) => {
				if (drive.name === replacedDrive) {
					const oldDisk = disk({ ...drive, id: driveId(2) }, 'REMOVED');
					const newDisk = disk(drive, 'ONLINE', { scanProcessed: 1 });
					return [`replacing-${position}`, { name: `replacing-${position}`, vdevType: 'replacing', state: 'DEGRADED', vdevs: { [oldDisk.name]: oldDisk, [newDisk.name]: newDisk } }];
				}

				return [drive.id, disk(drive, (drive.name === missingDrive ? 'REMOVED' : 'ONLINE'))];
			}))
		};
	}

	const size = topology.usableBytes;
	const scans = { running: scrubRunning, resilver: resilverRunning, finished: scrubFinished };
	const scanStats = (now === null ? null : (scans[scan] || scrubFinished)(now, size));
	return {
		name: 'messier',
		type: 'POOL',
		state: (isDegraded ? 'DEGRADED' : 'ONLINE'),
		poolGuid: POOL_GUID,
		properties: properties(size, usedPercent, (isDegraded ? 'DEGRADED' : 'ONLINE')),
		vdevs: {
			messier: { name: 'messier', vdevType: 'root', state: (isDegraded ? 'DEGRADED' : 'ONLINE'), vdevs: groups }
		},
		...(scanStats ? { scanStats } : {}),
		errorCount: 0
	};
};

export {
	drives,
	systemPool,
	dataPool,
	snapshots
};
