import fs from 'node:fs';
import path from 'node:path';

const CORE_APPS = {
	wetty: { title: 'Terminal', category: 'Networking', icon: 'terminal.svg', router: 'wetty', host: 'terminal' },
	authelia: { title: 'Authelia', category: 'System', icon: 'authelia.svg', router: 'authelia', host: 'auth' },
	traefik: { title: 'Traefik', category: 'System', icon: 'traefik-proxy.svg', router: 'dashboard', host: 'traefik' }
};
const CORE_APP_NAMES = Object.keys(CORE_APPS);

const routerLabel = (router, suffix) => {
	return `traefikHttpRouters${router.charAt(0).toUpperCase()}${router.slice(1)}${suffix}`;
};

const queuedJob = (name) => {
	return { id: `job-${name}`, name: 'app:install', data: { config: { name } }, progress: 0 };
};

const downloadingJob = (name, percent) => {
	return {
		...queuedJob(name),
		progress: {
			state: 'active',
			message: `Downloading ${CORE_APPS[name].title}...`,
			progress: {
				[name]: { text: 'Pulling', layers: { layer: { percentWeighted: percent } } }
			}
		}
	};
};

const installingJob = (name) => {
	return {
		...queuedJob(name),
		progress: { state: 'active', message: `Installing ${CORE_APPS[name].title}...`, progress: {} }
	};
};

const catalogue = (appsDir) => {
	const { templates } = JSON.parse(fs.readFileSync(path.join(appsDir, 'templates.json'), 'utf8'));
	return templates.map((template) => {
		const prefix = template.env?.find((variable) => { return variable.prefix; })?.prefix;
		return {
			name: template.name,
			title: template.title,
			category: template.categories[0],
			icon: path.basename(template.logo),
			router: template.name.replace(/[^a-z0-9]/gi, ''),
			host: (prefix ? prefix.replace(/\.$/, '') : null)
		};
	});
};

const runningApps = (entries, fqdn) => {
	return {
		configured: entries.map((app, index) => {
			return { id: index + 1, type: 'app', name: app.name, title: app.title, category: app.category, icon: app.icon };
		}),
		containers: entries.map((app) => {
			return {
				id: `container-${app.name}`,
				name: app.name,
				state: 'running',
				labels: {
					comDockerComposeProject: app.name,
					comDockerComposeService: app.name,
					...(app.host ? {
						[routerLabel(app.router, 'Rule')]: `Host(\`${app.host}.${fqdn}\`)`,
						[routerLabel(app.router, 'Entrypoints')]: 'https'
					} : {})
				}
			};
		})
	};
};

const running = (names, fqdn) => {
	return runningApps(names.map((name) => { return { name, ...CORE_APPS[name] }; }), fqdn);
};

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;
const TOTAL_MEMORY = 15.8 * GIB;

const EXAMPLE_APP = 'nextcloud';
const INDEXED_APPS = [EXAMPLE_APP];

const APP_USAGE = {
	traefik: { cpu: 0.42, memory: 48, rx: 1.2, tx: 2.4, data: 0.02, snapshots: 0.01 },
	authelia: { cpu: 0.08, memory: 36, rx: 0.02, tx: 0.03, data: 0.01, snapshots: 0.004 },
	wetty: { cpu: 0.02, memory: 24, rx: 0.002, tx: 0.004, data: 0.001, snapshots: 0.001 },
	nextcloud: { cpu: 3.6, memory: 1180, rx: 3.1, tx: 8.4, data: 96, snapshots: 12.4 }
};

const SNAPSHOT_CLOCK = Date.UTC(2026, 8, 29, 17, 40);

const SNAPSHOT_HISTORY = [
	['2025-11-19_17:30:01_monthly', 724123648],
	['2025-12-01_00:00:03_monthly', 702652416],
	['2026-01-01_00:00:03_monthly', 3184820224],
	['2026-01-23_09:15:11_yearly', 295600128],
	['2026-02-01_00:00:01_monthly', 200392704],
	['2026-03-01_00:00:13_monthly', 674824192],
	['2026-04-01_00:00:23_monthly', 719937536],
	['2026-05-01_00:00:18_monthly', 757899264],
	['2026-06-01_00:00:17_monthly', 771915776],
	['2026-07-01_00:00:08_monthly', 762806272],
	['2026-08-01_00:00:17_monthly', 2031575040],
	['2026-08-31_00:00:14_daily', 354205696],
	['2026-09-01_00:00:14_monthly', 0],
	['2026-09-01_00:00:14_daily', 0],
	['2026-09-02_00:00:09_daily', 21946368],
	['2026-09-03_00:00:01_daily', 21889024],
	['2026-09-04_00:00:10_daily', 22822912],
	['2026-09-05_00:00:03_daily', 23830528],
	['2026-09-06_00:00:08_daily', 23060480],
	['2026-09-07_00:00:13_daily', 35086336],
	['2026-09-08_00:00:13_daily', 14753792],
	['2026-09-09_00:00:16_daily', 23035904],
	['2026-09-10_00:00:02_daily', 14647296],
	['2026-09-11_00:00:02_daily', 14680064],
	['2026-09-12_00:00:01_daily', 24633344],
	['2026-09-13_00:00:02_daily', 14639104],
	['2026-09-14_00:00:03_daily', 14680064],
	['2026-09-15_00:00:02_daily', 22421504],
	['2026-09-16_00:00:03_daily', 38371328],
	['2026-09-17_00:00:02_daily', 36274176],
	['2026-09-18_00:00:03_daily', 15138816],
	['2026-09-19_00:00:03_daily', 14942208],
	['2026-09-20_00:00:03_daily', 14934016],
	['2026-09-21_00:00:02_daily', 14614528],
	['2026-09-22_00:00:02_daily', 14761984],
	['2026-09-23_00:00:07_daily', 23019520],
	['2026-09-24_00:00:06_daily', 103628800],
	['2026-09-25_00:00:06_daily', 15343616],
	['2026-09-26_00:00:02_daily', 14835712],
	['2026-09-27_00:00:02_daily', 14909440],
	['2026-09-28_00:00:02_daily', 14778368],
	['2026-09-28_06:00:02_hourly', 909312],
	['2026-09-28_07:00:01_hourly', 860160],
	['2026-09-28_08:00:01_hourly', 835584],
	['2026-09-28_09:00:03_hourly', 950272],
	['2026-09-28_10:00:02_hourly', 917504],
	['2026-09-28_11:00:01_hourly', 925696],
	['2026-09-28_12:00:02_hourly', 958464],
	['2026-09-28_13:00:02_hourly', 843776],
	['2026-09-28_14:00:02_hourly', 843776],
	['2026-09-28_15:00:02_hourly', 851968],
	['2026-09-28_16:00:02_hourly', 851968],
	['2026-09-28_17:00:03_hourly', 753664],
	['2026-09-28_18:00:02_hourly', 753664],
	['2026-09-28_19:00:02_hourly', 909312],
	['2026-09-28_20:00:02_hourly', 786432],
	['2026-09-28_21:00:01_hourly', 761856],
	['2026-09-28_22:00:02_hourly', 778240],
	['2026-09-28_23:00:06_hourly', 761856],
	['2026-09-29_00:00:02_daily', 0],
	['2026-09-29_00:00:02_hourly', 0],
	['2026-09-29_01:00:02_hourly', 778240],
	['2026-09-29_02:00:02_hourly', 778240],
	['2026-09-29_03:00:02_hourly', 770048],
	['2026-09-29_04:00:01_hourly', 794624],
	['2026-09-29_05:00:02_hourly', 786432],
	['2026-09-29_06:00:01_hourly', 802816],
	['2026-09-29_07:00:01_hourly', 770048],
	['2026-09-29_08:00:02_hourly', 794624],
	['2026-09-29_09:00:02_hourly', 802816],
	['2026-09-29_10:00:02_hourly', 892928],
	['2026-09-29_11:00:02_hourly', 868352],
	['2026-09-29_12:00:02_hourly', 794624],
	['2026-09-29_13:00:01_hourly', 794624],
	['2026-09-29_14:00:01_hourly', 802816],
	['2026-09-29_15:00:02_hourly', 802816],
	['2026-09-29_16:00:02_hourly', 802816],
	['2026-09-29_17:00:02_hourly', 811008]
];

const APP_LOG = [
	'[migrations] started',
	'[migrations] no migrations found',
	'[custom-init] No custom files found, skipping...',
	'[ls.io-init] done.',
	'nginx: [notice] using the "epoll" event method',
	'nginx: [notice] start worker processes',
	'php-fpm: fpm is running, pid 312',
	'php-fpm: ready to handle connections',
	'notify_push: Listening on 0.0.0.0:7867',
	'cron: Running background jobs',
	'cron: background jobs finished in 2.4s',
	'nginx: "GET /status.php HTTP/1.1" 200 181',
	'nginx: "PROPFIND /remote.php/dav/files/olivia/ HTTP/1.1" 207 1204',
	'nginx: "GET /apps/memories/api/days HTTP/1.1" 200 5873',
	'nginx: "PUT /remote.php/dav/files/james/Documents/report.pdf HTTP/1.1" 201 0'
];

const TERMINAL_PROMPT = 'root@nextcloud:/# ';

const expandVariables = (value) => {
	return String(value ?? '').replace(/\$\{[^}:]*:-([^}]*)\}/g, '$1').replace(/\$\{[^}]*\}/g, '');
};

const templates = (appsDir) => {
	const { templates: list } = JSON.parse(fs.readFileSync(path.join(appsDir, 'templates.json'), 'utf8'));
	return list.map((template) => {
		return { ...template, logo: `assets/img/apps/${path.basename(template.logo)}` };
	});
};

const portsOf = (service) => {
	return (service.ports || []).map((port) => {
		const [mapping, type = 'tcp'] = String(port).split('/');
		const parts = mapping.split(':');
		return { publicPort: Number(parts.at(-2) ?? parts.at(-1)), privatePort: Number(parts.at(-1)), type };
	});
};

const mountsOf = (service) => {
	return (service.volumes || [])
		.filter((volume) => { return typeof volume === 'string' && volume.startsWith('/'); })
		.map((volume) => {
			const [source, destination, mode] = volume.split(':');
			return { type: 'bind', source, destination, rw: mode !== 'ro' };
		});
};

const networksOf = (service, appIndex, serviceIndex) => {
	const names = (Array.isArray(service.networks) ? service.networks : Object.keys(service.networks || { default: {} }));
	return Object.fromEntries(names.map((name) => {
		const isShared = (name === 'virgo' || name === 'default');
		const address = (isShared ? `172.30.10.${10 + appIndex * 8 + serviceIndex}` : `172.31.${appIndex}.${serviceIndex + 2}`);
		return [name, { ipAddress: address, gateway: (isShared ? '172.30.0.1' : '') }];
	}));
};

const serviceHasRoute = (service) => {
	const labels = (Array.isArray(service.labels) ? service.labels : Object.entries(service.labels || {}).map(([key, value]) => { return `${key}=${value}`; }));
	return labels.some((label) => { return label.startsWith('traefik.http.routers.') && label.includes('.rule='); });
};

const isOneShot = (service) => {
	return String(service.restart) === 'no';
};

const installed = ({ appsDir, parseYaml, fqdn, domainName, names = CORE_APP_NAMES, updatable = null }) => {
	const catalogueTemplates = templates(appsDir);
	const configured = [];
	const containers = [];
	const appsResourceMetrics = [];
	names.forEach((name, appIndex) => {
		const template = catalogueTemplates.find((entry) => { return entry.name === name; });
		const compose = parseYaml(path.join(appsDir, template.repository.stackfile));
		const prefix = template.env?.find((variable) => { return variable.prefix; })?.prefix;
		const host = (prefix ? `${prefix}${(Object.hasOwn(CORE_APPS, name) ? fqdn : domainName)}` : null);
		const usage = APP_USAGE[name];
		const services = Object.entries(compose.services).filter(([, service]) => { return !isOneShot(service); });
		configured.push({ id: appIndex + 1, type: 'app', name, title: template.title, category: template.categories[0], icon: path.basename(template.logo), canBeRemoved: !Object.hasOwn(CORE_APPS, name), dataset: `messier/apps/${name}` });
		const routed = services.find(([, service]) => { return serviceHasRoute(service); })?.[0];
		const containerMetrics = services.map(([serviceName, service], serviceIndex) => {
			const id = `${name}-${serviceName}`;
			const share = (serviceName === routed || services.length === 1 ? 0.7 : 0.3 / Math.max(services.length - 1, 1));
			containers.push({
				id,
				names: [`/${name}-${serviceName}-1`],
				image: expandVariables(service.image),
				state: 'running',
				labels: {
					comDockerComposeProject: name,
					comDockerComposeService: serviceName,
					...((host && serviceName === routed) ? {
						[routerLabel(name.replace(/[^a-z0-9]/gi, ''), 'Rule')]: `Host(\`${host}\`)`,
						[routerLabel(name.replace(/[^a-z0-9]/gi, ''), 'Entrypoints')]: 'https'
					} : {})
				},
				mounts: mountsOf(service),
				hostConfig: { networkMode: service.network_mode ?? 'bridge' },
				networkSettings: { networks: (service.network_mode === 'host' ? { host: { ipAddress: '' } } : networksOf(service, appIndex, serviceIndex)) },
				ports: portsOf(service)
			});
			return {
				id,
				cpu: { percent: usage.cpu * share },
				memory: { usage: usage.memory * MIB * share, percent: usage.memory * MIB * share / TOTAL_MEMORY * 100 },
				network: { rx: usage.rx * MIB * share, tx: usage.tx * MIB * share }
			};
		});
		appsResourceMetrics.push({
			name,
			cpu: { percent: usage.cpu },
			memory: { usage: usage.memory * MIB, percent: usage.memory * MIB / TOTAL_MEMORY * 100 },
			network: { rx: usage.rx * MIB, tx: usage.tx * MIB },
			storage: { dataset: usage.data * GIB, snapshots: usage.snapshots * GIB },
			containers: containerMetrics
		});
	});
	const updated = containers.find((container) => { return container.labels.comDockerComposeProject === updatable; });
	return {
		configured,
		containers,
		appsResourceMetrics,
		imageUpdates: (updated ? [{ containerId: updated.id, app: updatable, service: updated.labels.comDockerComposeService }] : []),
		templates: catalogueTemplates,
		indexerDatasets: INDEXED_APPS.map((name) => { return `messier/apps/${name}`; })
	};
};

const appSnapshots = (name = EXAMPLE_APP) => {
	const dataset = `messier/apps/${name}`;
	return Object.fromEntries(SNAPSHOT_HISTORY.map(([stamp, used]) => {
		const snapshotName = `autosnap_${stamp}`;
		const fullName = `${dataset}@${snapshotName}`;
		return [fullName, { name: fullName, dataset, snapshotName, pool: 'messier', properties: { used: { value: used } } }];
	}));
};

const installingJobFor = (name = EXAMPLE_APP) => {
	return { id: `job-install-${name}`, name: 'app:install', opts: {}, data: { config: { name } }, progress: { state: 'active', message: 'Downloading...', progress: {} } };
};

const updateJob = (progress, name = EXAMPLE_APP) => {
	return { id: `job-update-${name}`, name: 'app:update', opts: {}, data: { config: { name } }, progress };
};

const updatingJob = (title, name = EXAMPLE_APP) => {
	return updateJob({
		state: 'active',
		message: `Downloading ${title}...`,
		progress: {
			[name]: { text: 'Pulling', layers: { first: { percentWeighted: 74 }, second: { percentWeighted: 41 } } },
			db: { text: 'Pulled', layers: {} },
			redis: { text: 'Pulled', layers: {} }
		}
	}, name);
};

const updatedJob = (title, name = EXAMPLE_APP) => {
	return updateJob({ state: 'completed', message: `${title} updated.`, progress: {} }, name);
};

const containerLogs = (now, name = EXAMPLE_APP) => {
	const id = `${name}-${name}`;
	const start = now - APP_LOG.length * 7000;
	return {
		[id]: APP_LOG.map((line, index) => { return `${new Date(start + index * 7000).toISOString().replace('Z', '123456Z')} ${line}`; })
	};
};

const containerTerminal = (name = EXAMPLE_APP) => {
	return { [`${name}-${name}`]: `${TERMINAL_PROMPT}occ status\r\n  - installed: true\r\n  - version: 31.0.8.1\r\n  - versionstring: 31.0.8\r\n  - edition: \r\n  - maintenance: false\r\n  - needsDbUpgrade: false\r\n${TERMINAL_PROMPT}` };
};

const certificate = (fqdn, isIssued) => {
	return { required: true, hasCertificate: isIssued, resolves: true, fqdn };
};

export {
	CORE_APP_NAMES,
	queuedJob,
	downloadingJob,
	installingJob,
	catalogue,
	running,
	runningApps,
	EXAMPLE_APP,
	installed,
	appSnapshots,
	SNAPSHOT_CLOCK,
	installingJobFor,
	updatingJob,
	updatedJob,
	containerLogs,
	containerTerminal,
	certificate
};
