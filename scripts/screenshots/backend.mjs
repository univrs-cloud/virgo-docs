import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME_TYPES = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.ico': 'image/x-icon',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ttf': 'font/ttf',
	'.webmanifest': 'application/manifest+json',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2'
};

const DRIVE_SIZE = 2048408248320;
const DRIVE_MODEL = 'KINGSTON SKC3000D2048G';
const HOSTNAME = 'spica';
const CLUSTER_DOMAIN = 'virgo.univrs.cloud';
const ADDRESS = '192.168.1.20';
const VIRTUAL_IP = '192.168.1.10';
const GATEWAY = '192.168.1.1';
const CORE_APPS = { wetty: 'Terminal', authelia: 'Authelia', traefik: 'Traefik' };

const createDrives = () => {
	const drives = ['nvme1n1', 'nvme0n1'].map((name, index) => {
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
	return [...drives, {
		name: 'mmcblk0',
		path: '/dev/mmcblk0',
		system: true,
		model: null,
		serialNumber: '0x00000000',
		size: 15523119104,
		capacity: { bytes: 15523119104 },
		health: { status: 'unsupported', problems: [], message: null }
	}];
};

const createPool = (drives, topology) => {
	const type = topology.type;
	const members = drives.filter((drive) => { return !drive.system; });
	const width = topology.width;
	const groups = {};
	for (let index = 0; index < members.length; index += width) {
		const name = `${type}-${index / width}`;
		groups[name] = {
			name,
			vdevType: type,
			state: 'ONLINE',
			vdevs: Object.fromEntries(members.slice(index, index + width).map((drive) => {
				return [drive.id, { name: drive.id, vdevType: 'disk', state: 'ONLINE' }];
			}))
		};
	}

	return {
		name: 'messier',
		properties: {
			health: { value: 'ONLINE' },
			size: { value: topology.usableBytes },
			free: { value: Math.round(topology.usableBytes * 0.99) }
		},
		vdevs: {
			messier: { name: 'messier', vdevType: 'root', state: 'ONLINE', vdevs: groups }
		}
	};
};

const queuedJob = (name) => {
	return { id: `job-${name}`, name: 'app:install', data: { config: { name } }, progress: 0 };
};

const downloadingJob = (name, percent) => {
	return {
		...queuedJob(name),
		progress: {
			state: 'active',
			message: `Downloading ${CORE_APPS[name]}...`,
			progress: {
				[name]: { text: 'Pulling', layers: { layer: { percentWeighted: percent } } }
			}
		}
	};
};

const installingJob = (name) => {
	return {
		...queuedJob(name),
		progress: { state: 'active', message: `Installing ${CORE_APPS[name]}...`, progress: {} }
	};
};

const runningApps = (names) => {
	return {
		configured: names.map((name) => { return { name }; }),
		containers: names.map((name) => {
			return {
				id: `container-${name}`,
				name,
				state: 'running',
				labels: { comDockerComposeProject: name, comDockerComposeService: name }
			};
		})
	};
};

const createState = (topologies) => {
	const drives = createDrives();
	return {
		setupCompleted: false,
		system: {
			osInfo: { hostname: HOSTNAME, fqdn: `${HOSTNAME}.${CLUSTER_DOMAIN}` },
			networkInterfaces: [{
				ifname: 'bond0',
				default: true,
				addrInfo: [
					{ family: 'inet', local: ADDRESS, prefixlen: 24, dynamic: false },
					{ family: 'inet', local: VIRTUAL_IP, prefixlen: 24, dynamic: false }
				],
				gateway: GATEWAY,
				dnsServers: [GATEWAY]
			}],
			virtualIp: { address: VIRTUAL_IP, netmask: '24', holding: true }
		},
		discovery: [],
		drives,
		topologies: topologies(drives),
		storage: [],
		importable: [],
		certificate: null,
		configuration: { fleet: {} },
		jobs: [],
		users: [{ uid: 1000, username: 'voyager' }],
		configured: [],
		containers: []
	};
};

const serveFile = (root, request, response) => {
	const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
	let file = path.join(root, pathname);
	if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
		file = path.join(root, 'index.html');
	}

	response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
	fs.createReadStream(file).pipe(response);
};

const startBackend = async ({ uiDir, apiDir }) => {
	const require = createRequire(path.join(apiDir, 'package.json'));
	const { Server } = await import(pathToFileURL(require.resolve('socket.io')).href);
	const { getTopologies } = await import(pathToFileURL(path.join(apiDir, 'src/utils/topology.js')).href);
	const root = path.join(uiDir, 'dist');
	if (!fs.existsSync(path.join(root, 'index.html'))) {
		throw new Error(`No build found at ${root}.`);
	}

	const state = createState(getTopologies);
	const server = http.createServer((request, response) => { serveFile(root, request, response); });
	const io = new Server(server, { path: '/api', serveClient: false });

	io.of('/runtime').on('connection', (socket) => {
		socket.emit('role', 'node');
	});

	io.of('/host').on('connection', (socket) => {
		socket.emit('host:update', null);
		socket.emit('host:system', state.system);
		socket.emit('host:discovery', state.discovery);
		socket.emit('host:drives', state.drives);
		socket.emit('host:storage:topologies', state.topologies);
		socket.emit('host:storage', state.storage);
		socket.emit('host:storage:importable', state.importable);
		socket.emit('host:certificate', state.certificate);
		socket.emit('host:setupCompleted', state.setupCompleted);
		socket.on('host:storage:importable:fetch', () => {
			socket.emit('host:storage:importable', state.importable);
		});
	});

	io.of('/configuration').on('connection', (socket) => {
		socket.emit('configuration', state.configuration);
		socket.on('configuration:fleet:domain:availability', (data, acknowledge) => {
			acknowledge?.({ status: 'succeeded', available: true });
		});
	});

	io.of('/job').on('connection', (socket) => {
		socket.emit('jobs', state.jobs);
	});

	io.of('/user').on('connection', (socket) => {
		socket.emit('users', state.users);
	});

	io.of('/docker').on('connection', (socket) => {
		socket.emit('app:configured', state.configured);
		socket.emit('app:containers', state.containers);
	});

	await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });

	return {
		url: `http://localhost:${server.address().port}`,
		state,
		createPool: (topology) => { return createPool(state.drives, topology); },
		queuedJob,
		downloadingJob,
		installingJob,
		runningApps,
		close: () => {
			io.close();
			server.close();
		}
	};
};

export {
	startBackend
};
