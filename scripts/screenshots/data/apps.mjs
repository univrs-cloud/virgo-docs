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

const running = (names, fqdn) => {
	return {
		configured: names.map((name, index) => {
			const app = CORE_APPS[name];
			return { id: index + 1, type: 'app', name, title: app.title, category: app.category, icon: app.icon };
		}),
		containers: names.map((name) => {
			const app = CORE_APPS[name];
			return {
				id: `container-${name}`,
				name,
				state: 'running',
				labels: {
					comDockerComposeProject: name,
					comDockerComposeService: name,
					[routerLabel(app.router, 'Rule')]: `Host(\`${app.host}.${fqdn}\`)`,
					[routerLabel(app.router, 'Entrypoints')]: 'https'
				}
			};
		})
	};
};

const certificate = (fqdn, isIssued) => {
	return { required: true, hasCertificate: isIssued, resolves: true, fqdn };
};

export {
	CORE_APP_NAMES,
	queuedJob,
	downloadingJob,
	installingJob,
	running,
	certificate
};
