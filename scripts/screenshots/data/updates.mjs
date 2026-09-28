const AVAILABLE = [
	{ package: 'virgo-api', version: { installed: '2.19.21', updatableTo: '2.20.0' } },
	{ package: 'virgo-ui', version: { installed: '2.19.20', updatableTo: '2.20.0' } },
	{ package: 'docker-ce', version: { installed: '5:28.4.0-1', updatableTo: '5:28.5.1-1' } },
	{ package: 'openssl', version: { installed: '3.5.1-1', updatableTo: '3.5.4-1' } }
];

const STEPS = [
	'Reading package lists...',
	'Building dependency tree...',
	'Reading state information...',
	'Calculating upgrade...',
	'The following packages will be upgraded:',
	'  docker-ce openssl virgo-api virgo-ui',
	'4 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.',
	'Need to get 48.6 MB of archives.',
	'Get:1 virgo-api 2.20.0 [11.2 MB]',
	'Get:2 virgo-ui 2.20.0 [6.4 MB]',
	'Get:3 docker-ce 5:28.5.1-1 [29.3 MB]'
];

const INSTALL_STEPS = [
	'Get:4 openssl 3.5.4-1 [1.7 MB]',
	'Unpacking virgo-api (2.20.0) over (2.19.21) ...',
	'Unpacking virgo-ui (2.20.0) over (2.19.20) ...',
	'Unpacking docker-ce (5:28.5.1-1) over (5:28.4.0-1) ...',
	'Unpacking openssl (3.5.4-1) over (3.5.1-1) ...',
	'Setting up virgo-api (2.20.0) ...',
	'Setting up virgo-ui (2.20.0) ...',
	'Setting up docker-ce (5:28.5.1-1) ...',
	'Setting up openssl (3.5.4-1) ...'
];

const FAILED_STEPS = [
	'Get:4 openssl 3.5.4-1 [1.7 MB]',
	'Unpacking virgo-api (2.20.0) over (2.19.21) ...',
	'Unpacking virgo-ui (2.20.0) over (2.19.20) ...',
	'Unpacking docker-ce (5:28.5.1-1) over (5:28.4.0-1) ...',
	'Unpacking openssl (3.5.4-1) over (3.5.1-1) ...',
	'Setting up openssl (3.5.4-1) ...',
	'Setting up virgo-ui (2.20.0) ...',
	'Setting up docker-ce (5:28.5.1-1) ...',
	'dpkg: error processing package docker-ce (--configure):',
	' installed docker-ce package post-installation script subprocess returned error exit status 1',
	'Errors were encountered while processing:',
	' docker-ce'
];

const available = () => {
	return AVAILABLE.map((update) => { return { ...update, version: { ...update.version } }; });
};

const running = () => {
	return { state: 'running', steps: [...STEPS], progress: { stage: 'download', percent: 42 }, isRebootRequired: false };
};

const finished = () => {
	return { state: 'succeeded', steps: [...STEPS, ...INSTALL_STEPS], isRebootRequired: false };
};

const failed = () => {
	return { state: 'failed', steps: [...STEPS, ...FAILED_STEPS], isRebootRequired: false };
};

export {
	available,
	running,
	finished,
	failed
};
