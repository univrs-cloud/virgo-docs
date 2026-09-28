const HOSTNAME = 'spica';
const DOMAINS = { univrs: 'virgo.univrs.cloud', custom: 'virgo.mydomain.com' };
const ADDRESS = '192.168.1.20';
const VIRTUAL_IP = '192.168.1.10';
const GATEWAY = '192.168.1.1';

const fqdn = (domain) => {
	return `${HOSTNAME}.${DOMAINS[domain]}`;
};

const PEER = { name: 'porrima', address: '192.168.1.21' };
const ADOPTABLE_PEER = { id: 'b6f1c2d4-porrima', ...PEER };

const system = (domain, isHolding = true) => {
	return {
		osInfo: { hostname: HOSTNAME, fqdn: fqdn(domain) },
		networkInterfaces: [{
			ifname: 'bond0',
			default: true,
			dhcp: false,
			speed: 1000,
			mtu: 1500,
			address: '02:00:5e:10:00:14',
			addrInfo: [
				{ family: 'inet', local: ADDRESS, prefixlen: 24, dynamic: false },
				{ family: 'inet', local: VIRTUAL_IP, prefixlen: 24, dynamic: false }
			],
			gateway: GATEWAY,
			dnsServers: [GATEWAY]
		}],
		virtualIp: { address: VIRTUAL_IP, netmask: '24', holding: isHolding }
	};
};

const holdingPeer = (domain) => {
	return [{ ...PEER, holdsVirtualIp: true, virtualIp: VIRTUAL_IP, cluster: DOMAINS[domain] }];
};

const adoptedPeers = () => {
	return [ADOPTABLE_PEER];
};

const discoveredPeers = (domain, isAdopted) => {
	return [{ ...ADOPTABLE_PEER, holdsVirtualIp: false, ...(isAdopted ? { virtualIp: VIRTUAL_IP, cluster: DOMAINS[domain] } : {}) }];
};

export {
	DOMAINS,
	fqdn,
	system,
	holdingPeer,
	adoptedPeers,
	discoveredPeers
};
