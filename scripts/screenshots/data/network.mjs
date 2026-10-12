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

const ALLOWED = [
	['icmp', null, 'Ping'],
	['tcp', 22, 'SSH Remote Login Protocol'],
	['tcp', 25, 'smtp'],
	['tcp', 53, 'Domain Name Server'],
	['udp', 53, 'Domain Name Server'],
	['udp', 67, 'bootps'],
	['udp', 68, 'bootpc'],
	['tcp', 80, 'WorldWideWeb HTTP'],
	['udp', 137, 'NETBIOS Name Service'],
	['udp', 138, 'NETBIOS Datagram Service'],
	['tcp', 139, 'NETBIOS session service'],
	['tcp', 443, 'http protocol over TLS/SSL'],
	['udp', 443, 'http protocol over TLS/SSL'],
	['tcp', 445, 'Microsoft Naked CIFS'],
	['tcp', 465, 'Submission over TLS'],
	['tcp', 587, 'Submission'],
	['tcp', 993, 'IMAP over SSL'],
	['tcp', 2999, 'ACME hook'],
	['tcp', 3000, 'virgoOS API'],
	['tcp', 3478, 'STUN'],
	['udp', 3478, 'STUN'],
	['tcp', 3493, 'Network UPS Tools'],
	['tcp', 4190, 'ManageSieve Protocol'],
	['udp', 5353, 'Multicast DNS'],
	['udp', 5355, 'LLMNR'],
	['tcp', 6881, 'qBittorrent'],
	['udp', 6881, 'qBittorrent'],
	['udp', 51820, 'WireGuard']
];
const MINUTE = 60;
const BANNED_ADDRESS = '203.0.113.77';
const BANS = [
	{ address: BANNED_ADDRESS, bannedMinutesAgo: 4, expiresInMinutes: 6 },
	{ address: '198.51.100.23', bannedMinutesAgo: 9, expiresInMinutes: 1 }
];

const firewall = (now = null) => {
	const seconds = Math.floor(now / 1000);
	const bans = (now === null ? [] : BANS.map(({ address, bannedMinutesAgo, expiresInMinutes }) => {
		return { address, bannedAt: seconds - bannedMinutesAgo * MINUTE, expiresAt: seconds + expiresInMinutes * MINUTE, permanent: false };
	}));
	return {
		policy: 'drop',
		rules: ALLOWED.map(([protocol, port, name]) => {
			return { protocol, ports: (port === null ? [] : [String(port)]), source: null, name };
		}),
		jails: [{
			name: 'sshd',
			currentlyFailed: (bans.length > 0 ? 1 : 0),
			totalFailed: (bans.length > 0 ? 46 : 0),
			currentlyBanned: bans.length,
			totalBanned: (bans.length > 0 ? 7 : 0),
			bans
		}]
	};
};

export {
	DOMAINS,
	BANNED_ADDRESS,
	fqdn,
	system,
	firewall,
	holdingPeer,
	adoptedPeers,
	discoveredPeers
};
