import * as apps from './apps.mjs';
import * as fleet from './fleet.mjs';
import * as network from './network.mjs';
import * as status from './status.mjs';
import * as storage from './storage.mjs';
import * as users from './users.mjs';

const withShortcuts = (running, shortcutList) => {
	return { ...running, configured: [...running.configured, ...shortcutList] };
};

const nodeState = (getTopologies, { domain = 'univrs', setupCompleted = false, poolUsedPercent = null, isRegistered = false, runningApps = [], jobs = [], certificateIssued = null, userList = [users.FACTORY_OWNER], withStatus = false, smtp = null, location = null, weather = null, trustedProxies = [], isStandby = false, now = null, scrub = null, missingDrive = null, replacedDrive = null, snapshotCount = 0, shareList = null, shortcutList = [] } = {}) => {
	const drives = storage.drives({ isReplaced: Boolean(replacedDrive) });
	const topologies = getTopologies(drives);
	const hasPool = (poolUsedPercent !== null);
	return {
		setupCompleted,
		system: network.system(domain, !isStandby),
		discovery: (isStandby ? network.holdingPeer(domain) : []),
		drives: (missingDrive ? drives.filter((drive) => { return drive.name !== missingDrive; }) : drives),
		topologies,
		storage: [storage.systemPool(), ...(hasPool ? [storage.dataPool(drives, topologies[0], poolUsedPercent, { now, scan: scrub, missingDrive, replacedDrive })] : [])],
		snapshots: storage.snapshots(snapshotCount),
		importable: [],
		certificate: (certificateIssued === null ? null : apps.certificate(network.fqdn(domain), certificateIssued)),
		configuration: {
			...(isRegistered ? fleet.registered() : fleet.unregistered()),
			...(smtp ? { smtp } : {}),
			...(location ? { location } : {}),
			trustedProxies
		},
		weather,
		jobs,
		users: userList,
		shares: shareList,
		updates: [],
		...withShortcuts(apps.running(runningApps, network.fqdn(domain)), shortcutList),
		...(withStatus ? status.status() : { cpuStats: null, memory: null, networkStats: null, time: null, ups: null })
	};
};

export {
	nodeState
};
