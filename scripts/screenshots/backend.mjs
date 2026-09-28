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

const APP_ICONS_PATH = '/assets/img/apps/';
const SHORTCUT_ICONS_PATH = '/assets/img/shortcuts/';
const SHORTCUT_ICONS_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';

const serveShortcutIcon = async (file, response) => {
	const extension = path.extname(file).slice(1).toLowerCase();
	const upstream = await fetch(`${SHORTCUT_ICONS_CDN}/${extension}/${file}`).catch(() => { return null; });
	if (!upstream?.ok) {
		response.writeHead(404);
		response.end();
		return;
	}

	response.writeHead(200, { 'Content-Type': MIME_TYPES[`.${extension}`] || 'application/octet-stream' });
	response.end(Buffer.from(await upstream.arrayBuffer()));
};

const serveFile = (root, iconsDir, request, response) => {
	const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
	if (pathname.startsWith(SHORTCUT_ICONS_PATH)) {
		serveShortcutIcon(path.basename(pathname), response);
		return;
	}

	let file = (pathname.startsWith(APP_ICONS_PATH) ? path.join(iconsDir, pathname.slice(APP_ICONS_PATH.length)) : path.join(root, pathname));
	if (pathname.startsWith(APP_ICONS_PATH) && file.startsWith(iconsDir) && fs.existsSync(file)) {
		response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
		fs.createReadStream(file).pipe(response);
		return;
	}

	file = path.join(root, pathname);
	if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
		file = path.join(root, 'index.html');
	}

	response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
	fs.createReadStream(file).pipe(response);
};

const startBackend = async ({ uiDir, apiDir, appsDir }) => {
	const require = createRequire(path.join(apiDir, 'package.json'));
	const { Server } = await import(pathToFileURL(require.resolve('socket.io')).href);
	const { getTopologies } = await import(pathToFileURL(path.join(apiDir, 'src/utils/topology.js')).href);
	const root = path.join(uiDir, 'dist');
	if (!fs.existsSync(path.join(root, 'index.html'))) {
		throw new Error(`No build found at ${root}.`);
	}

	const state = {};
	const iconsDir = path.join(appsDir, 'images');
	const server = http.createServer((request, response) => { serveFile(root, iconsDir, request, response); });
	const io = new Server(server, { path: '/api', serveClient: false });

	io.of('/runtime').on('connection', (socket) => {
		socket.emit('role', 'node');
	});

	io.of('/host').on('connection', (socket) => {
		socket.emit('host:update', state.update ?? null);
		socket.emit('host:updates:check', state.checkUpdates ?? false);
		socket.emit('host:system', state.system);
		socket.emit('host:discovery', state.discovery);
		socket.emit('host:peers', state.peers ?? []);
		socket.emit('host:drives', state.drives);
		socket.emit('host:storage:topologies', state.topologies);
		socket.emit('host:storage', state.storage);
		socket.emit('host:storage:importable', state.importable);
		socket.emit('host:storage:snapshots', state.snapshots ?? {});
		socket.emit('host:certificate', state.certificate);
		socket.emit('host:updates', state.updates);
		socket.emit('host:cpu:stats', state.cpuStats);
		socket.emit('host:memory', state.memory);
		socket.emit('host:network:stats', state.networkStats);
		socket.emit('host:time', state.time);
		socket.emit('host:ups', state.ups);
		socket.emit('host:setupCompleted', state.setupCompleted);
		socket.emit('host:system:services', state.services ?? null);
		socket.on('host:system:services:fetch', () => {
			socket.emit('host:system:services', state.services ?? null);
		});
		socket.on('host:service:logs:connect', (unit) => {
			socket.emit('host:service:logs:connected');
			for (const line of (state.serviceLogs?.[unit] || [])) {
				socket.emit('host:service:logs:output', line);
			}
		});
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

	io.of('/weather').on('connection', (socket) => {
		if (state.weather) {
			socket.emit('weather', state.weather);
		}
	});

	io.of('/job').on('connection', (socket) => {
		socket.emit('jobs', state.jobs);
	});

	io.of('/user').on('connection', (socket) => {
		socket.emit('users', state.users);
	});

	io.of('/share').on('connection', (socket) => {
		if (state.shares) {
			socket.emit('shares', state.shares);
		}
		socket.on('share:paths:custom', () => {
			socket.emit('share:paths:custom', state.customPaths ?? []);
		});
	});

	io.of('/shortcut');

	io.of('/indexer').on('connection', (socket) => {
		if (state.indexerStats) {
			socket.emit('indexer:stats', state.indexerStats);
		}
	});

	io.of('/docker').on('connection', (socket) => {
		socket.emit('app:configured', state.configured);
		socket.emit('app:containers', state.containers);
	});

	await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });

	return {
		url: `http://localhost:${server.address().port}`,
		appsDir,
		getTopologies,
		broadcast: (namespace, event, payload) => {
			io.of(namespace).emit(event, payload);
		},
		setState: (next) => {
			for (const key of Object.keys(state)) {
				delete state[key];
			}

			Object.assign(state, next);
		},
		close: () => {
			io.close();
			server.close();
		}
	};
};

export {
	startBackend
};
