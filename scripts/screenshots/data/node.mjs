import * as about from './about.mjs';
import * as apps from './apps.mjs';
import * as fleet from './fleet.mjs';
import * as network from './network.mjs';
import * as status from './status.mjs';
import * as storage from './storage.mjs';
import * as users from './users.mjs';

const withShortcuts = (running, shortcutList) => {
	return { ...running, configured: [...running.configured, ...shortcutList] };
};

const withAbout = (system, apiVersion) => {
	if (apiVersion === null) {
		return system;
	}

	const details = about.system(apiVersion);
	return { ...system, ...details, osInfo: { ...system.osInfo, kernel: about.SOFTWARE.kernel } };
};

const nodeState = (getTopologies, { domain = 'univrs', setupCompleted = false, poolUsedPercent = null, isRegistered = false, runningApps = [], jobs = [], certificateIssued = null, userList = [users.FACTORY_OWNER], sessionList = [], withStatus = false, smtp = null, location = null, weather = null, trustedProxies = [], isStandby = false, now = null, scrub = null, missingDrive = null, replacedDrive = null, snapshotCount = 0, shareList = null, clientList = null, shortcutList = [], peer = null, appEntries = null, apiVersion = null, hasBans = false } = {}) => {
	const drives = storage.drives({ isReplaced: Boolean(replacedDrive) });
	const topologies = getTopologies(drives);
	const hasPool = (poolUsedPercent !== null);
	return {
		setupCompleted,
		system: withAbout(network.system(domain, !isStandby), apiVersion),
		discovery: (isStandby ? network.holdingPeer(domain) : (peer ? network.discoveredPeers(domain, peer === 'adopted') : [])),
		peers: (peer === 'adopted' ? network.adoptedPeers() : []),
		firewall: network.firewall(hasBans ? now : null),
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
		sessions: sessionList,
		shares: shareList,
		shareClients: clientList,
		updates: [],
		...withShortcuts((appEntries ? apps.runningApps(appEntries, network.fqdn(domain)) : apps.running(runningApps, network.fqdn(domain))), shortcutList),
		...(withStatus ? status.status() : { cpuSensors: null, memory: null, stats: null, time: null, ups: null })
	};
};

export {
	nodeState
};
