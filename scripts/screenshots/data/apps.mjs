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
	certificate
};
