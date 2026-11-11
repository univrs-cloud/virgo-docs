const AVAILABLE = [
	{
		package: 'virgo-api',
		version: { installed: '2.19.21', updatableTo: '2.20.0' },
		changelog: [
			'virgo-api (2.20.0) stable; urgency=low; Mon, 02 Nov 2026 18:20:41 +0200',
			'',
			'  Features',
			'  * include each pending update\'s changelog in the updates list',
			'  * restore files from a snapshot into a user\'s Nextcloud folder',
			'',
			'  Fixes',
			'  * keep the update log readable after a reconnect'
		].join('\n')
	},
	{
		package: 'virgo-ui',
		version: { installed: '2.19.20', updatableTo: '2.20.0' },
		changelog: [
			'virgo-ui (2.20.0) stable; urgency=low; Mon, 02 Nov 2026 18:18:05 +0200',
			'',
			'  Features',
			'  * show each update\'s changelog in the Updates list',
			'  * add illustrated empty states to the list pages'
		].join('\n')
	},
	{ package: 'docker-ce', version: { installed: '5:28.4.0-1', updatableTo: '5:28.5.1-1' } },
	{
		package: 'openssl',
		version: { installed: '3.5.1-1', updatableTo: '3.5.4-1' },
		changelog: [
			'openssl (3.5.4-1) unstable; urgency=medium; Wed, 01 Oct 2026 21:12:09 +0200',
			'',
			'  * Import 3.5.4',
			'    - CVE-2025-9230 (Out-of-bounds read & write in RFC 3211 KEK Unwrap)',
			'    - CVE-2025-9232 (Out-of-bounds read in HTTP client no_proxy handling)',
			'',
			'openssl (3.5.2-1) unstable; urgency=medium; Thu, 07 Aug 2026 20:45:33 +0200',
			'',
			'  * Import 3.5.2',
			'  * Drop a patch that is part of the release'
		].join('\n')
	}
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
