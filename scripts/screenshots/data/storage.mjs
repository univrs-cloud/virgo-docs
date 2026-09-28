const DRIVE_SIZE = 2048408248320;
const DRIVE_MODEL = 'KINGSTON SKC3000D2048G';
const SYSTEM_DRIVE_SIZE = 15523119104;

const drives = () => {
	const data = ['nvme1n1', 'nvme0n1'].map((name, index) => {
		const serialNumber = `EXAMPLE000000${index + 1}`;
		const eui = `nvme-eui.0000000000000000000000000000000${index + 1}`;
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

const properties = (size, usedPercent) => {
	const allocated = Math.round(size * usedPercent / 100);
	return {
		health: { value: 'ONLINE' },
		size: { value: size },
		allocated: { value: allocated },
		free: { value: size - allocated },
		capacity: { value: usedPercent }
	};
};

const systemPool = () => {
	return { name: 'system', properties: properties(14.4 * 1024 ** 3, 27) };
};

const dataPool = (members, topology, usedPercent) => {
	const disks = members.filter((drive) => { return !drive.system; });
	const groups = {};
	for (let index = 0; index < disks.length; index += topology.width) {
		const name = `${topology.type}-${index / topology.width}`;
		groups[name] = {
			name,
			vdevType: topology.type,
			state: 'ONLINE',
			vdevs: Object.fromEntries(disks.slice(index, index + topology.width).map((drive) => {
				return [drive.id, { name: drive.id, vdevType: 'disk', state: 'ONLINE' }];
			}))
		};
	}

	return {
		name: 'messier',
		properties: properties(topology.usableBytes, usedPercent),
		vdevs: {
			messier: { name: 'messier', vdevType: 'root', state: 'ONLINE', vdevs: groups }
		}
	};
};

export {
	drives,
	systemPool,
	dataPool
};
