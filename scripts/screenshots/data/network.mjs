const HOSTNAME = 'spica';
const DOMAINS = { univrs: 'virgo.univrs.cloud', custom: 'virgo.mydomain.com' };
const ADDRESS = '192.168.1.20';
const VIRTUAL_IP = '192.168.1.10';
const GATEWAY = '192.168.1.1';

const fqdn = (domain) => {
	return `${HOSTNAME}.${DOMAINS[domain]}`;
};

const system = (domain) => {
	return {
		osInfo: { hostname: HOSTNAME, fqdn: fqdn(domain) },
		networkInterfaces: [{
			ifname: 'bond0',
			default: true,
			speed: 1000,
			addrInfo: [
				{ family: 'inet', local: ADDRESS, prefixlen: 24, dynamic: false },
				{ family: 'inet', local: VIRTUAL_IP, prefixlen: 24, dynamic: false }
			],
			gateway: GATEWAY,
			dnsServers: [GATEWAY]
		}],
		virtualIp: { address: VIRTUAL_IP, netmask: '24', holding: true }
	};
};

export {
	DOMAINS,
	fqdn,
	system
};
