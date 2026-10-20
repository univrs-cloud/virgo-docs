const GIB = 1024 ** 3;
const MIB = 1024 ** 2;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const HOURLY_BACKUPS = 24;
const DAILY_BACKUPS = 30;

const TIME_MACHINES = [
	{ comment: 'Olivia MacBook Pro', user: 'olivia', machine: 'Olivia MacBook Pro', capacity: 500, used: 212, weeks: 38, compression: 1.06 },
	{ comment: 'James MacBook Air', user: 'james', machine: 'James MacBook Air', capacity: 250, used: 96, weeks: 0, days: 19, compression: 1.04 },
	{ comment: 'Studio iMac', user: 'voyager', machine: 'Studio iMac', capacity: 300, used: 268, weeks: 61, compression: 1.08 }
];

const NEW_TIME_MACHINE = { comment: 'Reception Mac mini', user: 'james', capacity: 200 };

const NEXTCLOUD_DATA = '/messier/apps/nextcloud/data';
const APPS_DATASET_SIZE = 1260;

const FOLDERS = [
	{ comment: 'Documents', users: ['james', 'olivia'], capacity: 500, used: 128, snapshots: 9.6, compression: 1.41 },
	{ comment: 'Photos', users: ['olivia', 'voyager'], capacity: 300, used: 174, snapshots: 4.2, compression: 1.02 },
	{ comment: 'Public', users: null, capacity: 100, used: 12, snapshots: 0.8, compression: 1.67 },
	{ comment: 'Olivia Nextcloud', users: ['olivia'], path: `${NEXTCLOUD_DATA}/olivia/files`, used: 38 }
];

const CUSTOM_PATHS = [
	`${NEXTCLOUD_DATA}/olivia/files`,
	`${NEXTCLOUD_DATA}/james/files`,
	`${NEXTCLOUD_DATA}/__groupfolders/1/files`
];

const NEW_FOLDER = { comment: 'Projects', users: ['james', 'olivia'], capacity: 200 };
const EXISTING_PATH_FOLDER = { comment: 'James Nextcloud', users: ['james'], path: `${NEXTCLOUD_DATA}/james/files` };

const SNAPSHOT_RETENTION = { frequently: 0, hourly: 36, daily: 30, weekly: 0, monthly: 60, yearly: 5 };
const FOLDER_SNAPSHOTS = 66;

const CLIENTS = [
	{ username: 'olivia', address: '192.168.1.48', shares: ['documents', 'photos'], rx: 0.4, tx: 6.2 },
	{ username: 'james', address: '192.168.1.63', shares: ['documents', 'time_machine_james_macbook_air'], rx: 14.8, tx: 0.2 },
	{ username: 'voyager', address: '192.168.1.42', shares: ['public'], rx: 0.05, tx: 0.9 },
	{ username: 'olivia', address: '10.8.0.2', shares: ['olivia_nextcloud'], rx: 0.1, tx: 1.3 }
];

const slug = (comment) => {
	return comment.toLowerCase().trim().replace(/\s+/g, '_');
};

const backupName = (date) => {
	return `${date.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '')}.backup`;
};

const history = (now, { weeks, days = DAILY_BACKUPS }) => {
	const dates = [];
	const latest = now - (now % HOUR_MS) - (7 * 60 * 1000);
	for (let hour = 0; hour < HOURLY_BACKUPS; hour++) {
		dates.push(latest - hour * HOUR_MS);
	}
	for (let day = 1; day <= days; day++) {
		dates.push(latest - HOURLY_BACKUPS * HOUR_MS - day * DAY_MS);
	}
	for (let week = 1; week <= weeks; week++) {
		dates.push(latest - HOURLY_BACKUPS * HOUR_MS - days * DAY_MS - week * WEEK_MS);
	}
	return dates.map((time) => {
		const createdAt = new Date(time);
		return { name: backupName(createdAt), createdAt: createdAt.toISOString() };
	});
};

const usage = (used, snapshots, compression) => {
	return {
		dataset: (used - snapshots) * GIB,
		snapshots: snapshots * GIB,
		compressratio: compression,
		savedbycompression: used * (compression - 1) * GIB
	};
};

const timeMachine = (now, { comment, user, machine, capacity, used, weeks, days, compression }) => {
	const size = capacity * GIB;
	const alloc = used * GIB;
	return {
		name: `time_machine_${slug(comment)}`,
		comment,
		path: `/time_machines/${slug(comment)}`,
		dataset: `messier/time_machines/${slug(comment)}`,
		validUsers: [user],
		size,
		free: size - alloc,
		alloc,
		cap: alloc / size * 100,
		storage: usage(used, 0, compression),
		isPrivate: true,
		isTimeMachine: true,
		timeMachine: [{ name: `${machine}.sparsebundle`, snapshots: history(now, { weeks, days }) }]
	};
};

const folder = ({ comment, users, capacity = APPS_DATASET_SIZE, used, snapshots = 0, compression = 0, path = null }) => {
	const size = capacity * GIB;
	const alloc = used * GIB;
	return {
		name: slug(comment),
		comment,
		path: (path ?? `/messier/folders/${slug(comment)}`),
		dataset: (path ? null : `messier/folders/${slug(comment)}`),
		snapshotPolicy: (path ? null : { mode: 'enabled', retention: SNAPSHOT_RETENTION }),
		...(users ? { validUsers: users } : {}),
		size,
		free: size - alloc,
		alloc,
		cap: alloc / size * 100,
		storage: (path ? usage(0, 0, 0) : usage(used, snapshots, compression)),
		isPrivate: Boolean(users),
		isTimeMachine: false
	};
};

const folders = () => {
	return FOLDERS.map(folder);
};

const customPaths = () => {
	return CUSTOM_PATHS;
};

const timeMachines = (now) => {
	return TIME_MACHINES.map((entry) => { return timeMachine(now, entry); });
};

const folderSnapshots = () => {
	return Object.fromEntries(folders().filter((entry) => { return entry.dataset; }).flatMap((entry) => {
		return Array.from({ length: FOLDER_SNAPSHOTS }, (_, index) => {
			const name = `${entry.dataset}@autosnap_${String(index).padStart(3, '0')}`;
			return [name, { name, dataset: entry.dataset, pool: 'messier' }];
		});
	}));
};

const clients = () => {
	return CLIENTS.map(({ username, address, shares, rx, tx }, index) => {
		return { id: String(index + 1), username, address, shares, rx: rx * MIB, tx: tx * MIB };
	});
};

export {
	NEW_FOLDER,
	EXISTING_PATH_FOLDER,
	NEW_TIME_MACHINE,
	folders,
	customPaths,
	timeMachines,
	folderSnapshots,
	clients
};
