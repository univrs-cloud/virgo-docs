import * as apps from './apps.mjs';
import * as fleet from './fleet.mjs';
import * as network from './network.mjs';
import * as status from './status.mjs';
import * as storage from './storage.mjs';
import * as users from './users.mjs';

const nodeState = (getTopologies, { domain = 'univrs', setupCompleted = false, poolUsedPercent = null, isRegistered = false, runningApps = [], jobs = [], certificateIssued = null, userList = [users.FACTORY_OWNER], withStatus = false, smtp = null, location = null, weather = null, trustedProxies = [], isStandby = false } = {}) => {
	const drives = storage.drives();
	const topologies = getTopologies(drives);
	const hasPool = (poolUsedPercent !== null);
	return {
		setupCompleted,
		system: network.system(domain, !isStandby),
		discovery: (isStandby ? network.holdingPeer(domain) : []),
		drives,
		topologies,
		storage: [storage.systemPool(), ...(hasPool ? [storage.dataPool(drives, topologies[0], poolUsedPercent)] : [])],
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
		updates: [],
		...apps.running(runningApps, network.fqdn(domain)),
		...(withStatus ? status.status() : { cpuStats: null, memory: null, networkStats: null, time: null, ups: null })
	};
};

export {
	nodeState
};
