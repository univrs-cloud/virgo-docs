const GIB = 1024 ** 3;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const HOURLY_BACKUPS = 24;
const DAILY_BACKUPS = 30;

const TIME_MACHINES = [
	{ comment: 'Olivia MacBook Pro', user: 'olivia', machine: 'Olivia MacBook Pro', capacity: 500, used: 212, weeks: 38 },
	{ comment: 'James MacBook Air', user: 'james', machine: 'James MacBook Air', capacity: 250, used: 96, weeks: 0, days: 19 },
	{ comment: 'Studio iMac', user: 'voyager', machine: 'Studio iMac', capacity: 300, used: 268, weeks: 61 }
];

const NEW_TIME_MACHINE = { comment: 'Reception Mac mini', user: 'james', capacity: 200 };

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

const timeMachine = (now, { comment, user, machine, capacity, used, weeks, days }) => {
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
		isPrivate: true,
		isTimeMachine: true,
		timeMachine: [{ name: `${machine}.sparsebundle`, snapshots: history(now, { weeks, days }) }]
	};
};

const timeMachines = (now) => {
	return TIME_MACHINES.map((entry) => { return timeMachine(now, entry); });
};

export {
	NEW_TIME_MACHINE,
	timeMachines
};
