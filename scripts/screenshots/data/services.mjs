const TOTAL_MEMORY = 16 * 1024 ** 3;
const MIB = 1024 ** 2;

const UNITS = [
	['docker.service', 'Docker Application Container Engine', 'active', 'running', 'enabled', 612],
	['containerd.service', 'containerd container runtime', 'active', 'running', 'enabled', 188],
	['virgo-api.service', 'virgoOS API', 'active', 'running', 'enabled', 246],
	['redis-server.service', 'Advanced key-value store', 'active', 'running', 'enabled', 21],
	['smbd.service', 'Samba SMB Daemon', 'active', 'running', 'enabled', 34],
	['nmbd.service', 'Samba NMB Daemon', 'active', 'running', 'enabled', 12],
	['avahi-daemon.service', 'Avahi mDNS/DNS-SD Stack', 'active', 'running', 'enabled', 4],
	['NetworkManager.service', 'Network Manager', 'active', 'running', 'enabled', 17],
	['ssh.service', 'OpenBSD Secure Shell server', 'active', 'running', 'enabled', 6],
	['fail2ban.service', 'Fail2Ban Service', 'active', 'running', 'enabled', 38],
	['zfs-zed.service', 'ZFS Event Daemon (zed)', 'active', 'running', 'enabled', 5],
	['cron.service', 'Regular background program processing daemon', 'active', 'running', 'enabled', 2],
	['systemd-journald.service', 'Journal Service', 'active', 'running', 'static', 29],
	['systemd-logind.service', 'User Login Management', 'active', 'running', 'static', 7],
	['systemd-timesyncd.service', 'Network Time Synchronization', 'active', 'running', 'enabled', 3],
	['virgo-virtual-ip.service', 'virgoOS virtual IP', 'active', 'exited', 'enabled', 0],
	['avahi-allow-interfaces.service', "Restrict Avahi to this machine's real network interfaces", 'active', 'exited', 'enabled', 0],
	['systemd-networkd-wait-online.service', 'Wait for Network to be Configured', 'failed', 'failed', 'disabled', 0],
	['systemd-networkd.service', 'Network Configuration', 'inactive', 'dead', 'masked', 0],
	['docker.socket', 'Docker Socket for the API', 'active', 'listening', 'enabled', 0],
	['ssh.socket', 'OpenBSD Secure Shell server socket', 'inactive', 'dead', 'disabled', 0],
	['apt-daily.timer', 'Daily apt download activities', 'active', 'waiting', 'enabled', 0],
	['apt-daily-upgrade.timer', 'Daily apt upgrade and clean activities', 'active', 'waiting', 'enabled', 0],
	['fstrim.timer', 'Discard unused filesystem blocks once a week', 'active', 'waiting', 'enabled', 0],
	['logrotate.timer', 'Daily rotation of log files', 'active', 'waiting', 'enabled', 0],
	['multi-user.target', 'Multi-User System', 'active', 'active', 'static', 0],
	['network-online.target', 'Network is Online', 'active', 'active', 'static', 0]
];

const services = () => {
	return UNITS.map(([unit, description, active, sub, unitFileState, memoryMib]) => {
		const usage = memoryMib * MIB;
		return {
			unit,
			load: 'loaded',
			active,
			sub,
			description,
			type: unit.split('.').pop(),
			unitFileState,
			broken: false,
			memory: { usage, percent: (usage / TOTAL_MEMORY) * 100 }
		};
	});
};

const LOG_UNIT = 'docker.service';

const LOGS = [
	'Jun 15 14:02:11 spica systemd[1]: Starting docker.service - Docker Application Container Engine...',
	'Jun 15 14:02:11 spica dockerd[812]: time="2026-06-15T14:02:11.402Z" level=info msg="Starting up"',
	'Jun 15 14:02:12 spica dockerd[812]: time="2026-06-15T14:02:12.118Z" level=info msg="Loading containers: start."',
	'Jun 15 14:02:14 spica dockerd[812]: time="2026-06-15T14:02:14.530Z" level=info msg="Loading containers: done."',
	'Jun 15 14:02:14 spica dockerd[812]: time="2026-06-15T14:02:14.611Z" level=info msg="Docker daemon" version=28.5.1',
	'Jun 15 14:02:14 spica dockerd[812]: time="2026-06-15T14:02:14.642Z" level=info msg="API listen on /run/docker.sock"',
	'Jun 15 14:02:14 spica systemd[1]: Started docker.service - Docker Application Container Engine.',
	'Jun 15 14:17:40 spica dockerd[812]: time="2026-06-15T14:17:40.207Z" level=warn msg="Health check for container traefik took longer than expected"',
	'Jun 15 14:28:03 spica dockerd[812]: time="2026-06-15T14:28:03.412Z" level=info msg="ignoring event" container=wetty topic=/tasks/delete'
];

export {
	LOG_UNIT,
	LOGS,
	services
};
