import { SETTLE_MS, sleep, newPage, closePage, setValue, followLink } from '../capture.mjs';
import * as apps from '../data/apps.mjs';
import * as fleet from '../data/fleet.mjs';
import { nodeState } from '../data/node.mjs';
import { OWNER_PASSWORD } from '../data/users.mjs';

const PADDING = 50;
const CERTIFICATE_GRACE_MS = 60000;
const FRESH_POOL_USED_PERCENT = 1;

const openStep = async (page, url, pathname, step) => {
	await page.goto(`${url}${pathname}`, { waitUntil: 'load' });
	await page.waitForSelector(`#${step}:not(.d-none)`, { visible: true });
	await sleep(SETTLE_MS);
};

const waitForContinue = async (page) => {
	await page.waitForFunction(() => {
		return !document.querySelector('#apps [data-action="continue"]')?.disabled;
	});
	await sleep(SETTLE_MS);
};

const readyForSignIn = (domain) => {
	return { domain, poolUsedPercent: FRESH_POOL_USED_PERCENT, isRegistered: true, runningApps: apps.CORE_APP_NAMES, certificateIssued: true };
};

const openFinish = async (page, url) => {
	await openStep(page, url, '/apps', 'apps');
	await waitForContinue(page);
	await page.click('#apps [data-action="continue"]');
	await page.waitForSelector('#password:not(.d-none)', { visible: true });
	await followLink(page, '/finish', '#finish:not(.d-none)');
};

const pages = {
	licence: async ({ browser, backend, capture, viewport }) => {
		backend.setState(nodeState(backend.getTopologies));
		const page = await newPage(browser, { ...viewport, height: 960 });
		await openStep(page, backend.url, '/', 'welcome');
		await capture.step(page, 'welcome', 'welcome', PADDING);
		await closePage(page);
	},
	interface: async ({ browser, backend, capture, viewport }) => {
		backend.setState(nodeState(backend.getTopologies));
		const page = await newPage(browser, viewport);
		await openStep(page, backend.url, '/network/interface', 'interface');
		await capture.step(page, 'interface', 'interface', PADDING);
		await closePage(page);
	},
	host: async ({ browser, backend, capture, viewport }) => {
		const page = await newPage(browser, viewport);
		backend.setState(nodeState(backend.getTopologies, { domain: 'univrs' }));
		await openStep(page, backend.url, '/network/host', 'host');
		await page.waitForFunction(() => {
			return document.querySelector('#host .availability-message')?.textContent === 'This name is available';
		});
		await sleep(SETTLE_MS);
		await capture.step(page, 'host', 'host', PADDING);

		backend.setState(nodeState(backend.getTopologies, { domain: 'custom' }));
		await openStep(page, backend.url, '/network/host', 'host');
		await page.waitForSelector('#host .dns-record:not(.d-none)', { visible: true });
		await capture.step(page, 'host', 'host-custom', PADDING);
		await closePage(page);
	},
	ports: async ({ browser, backend, capture, viewport }) => {
		backend.setState(nodeState(backend.getTopologies));
		const page = await newPage(browser, viewport);
		await openStep(page, backend.url, '/network/ports', 'ports');
		await capture.step(page, 'ports', 'ports', PADDING);
		await closePage(page);
	},
	storage: async ({ browser, backend, capture, viewport }) => {
		const page = await newPage(browser, viewport);
		backend.setState(nodeState(backend.getTopologies));
		await openStep(page, backend.url, '/storage', 'storage');
		await page.waitForSelector('#storage .summary:not(.d-none)');
		await capture.step(page, 'storage', 'storage', PADDING);

		await page.click('#storage [data-action="create"]');
		await page.waitForSelector('.modal.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(page, ['.modal.show .modal-content'], 'storage-confirm', PADDING);

		backend.setState(nodeState(backend.getTopologies, { poolUsedPercent: FRESH_POOL_USED_PERCENT }));
		await openStep(page, backend.url, '/storage', 'storage');
		await page.waitForSelector('#storage [data-action="continue"]:not(.d-none)');
		await capture.step(page, 'storage', 'storage-pool', PADDING);
		await closePage(page);
	},
	fleet: async ({ browser, backend, capture, viewport }) => {
		const page = await newPage(browser, viewport);
		backend.setState(nodeState(backend.getTopologies, { domain: 'univrs', poolUsedPercent: FRESH_POOL_USED_PERCENT }));
		await openStep(page, backend.url, '/fleet', 'fleet');
		await setValue(page, '#fleet .email', fleet.EMAIL);
		await setValue(page, '#fleet .password', fleet.PASSWORD);
		await capture.step(page, 'fleet', 'fleet', PADDING);

		backend.setState(nodeState(backend.getTopologies, { domain: 'univrs', poolUsedPercent: FRESH_POOL_USED_PERCENT, isRegistered: true }));
		await openStep(page, backend.url, '/fleet', 'fleet');
		await capture.step(page, 'fleet', 'fleet-registered', PADDING);

		backend.setState(nodeState(backend.getTopologies, { domain: 'custom', poolUsedPercent: FRESH_POOL_USED_PERCENT }));
		await openStep(page, backend.url, '/fleet', 'fleet');
		await page.waitForSelector('#fleet [data-action="skip"]:not(.d-none)', { visible: true });
		await setValue(page, '#fleet .email', fleet.EMAIL);
		await setValue(page, '#fleet .password', fleet.PASSWORD);
		await capture.step(page, 'fleet', 'fleet-custom', PADDING);
		await closePage(page);
	},
	apps: async ({ browser, backend, capture, viewport }) => {
		const installing = { poolUsedPercent: FRESH_POOL_USED_PERCENT, isRegistered: true };
		const page = await newPage(browser, viewport);

		backend.setState(nodeState(backend.getTopologies, { ...installing, jobs: [apps.downloadingJob('wetty', 40), apps.queuedJob('authelia'), apps.queuedJob('traefik')] }));
		await openStep(page, backend.url, '/apps', 'apps');
		await capture.step(page, 'apps', 'apps-terminal', PADDING);

		backend.setState(nodeState(backend.getTopologies, { ...installing, runningApps: ['wetty'], jobs: [apps.downloadingJob('authelia', 65), apps.queuedJob('traefik')] }));
		await openStep(page, backend.url, '/apps', 'apps');
		await capture.step(page, 'apps', 'apps-authelia', PADDING);

		backend.setState(nodeState(backend.getTopologies, { ...installing, runningApps: ['wetty', 'authelia'], jobs: [apps.installingJob('traefik')] }));
		await openStep(page, backend.url, '/apps', 'apps');
		await capture.step(page, 'apps', 'apps-traefik', PADDING);

		backend.setState(nodeState(backend.getTopologies, { ...installing, runningApps: apps.CORE_APP_NAMES, certificateIssued: false }));
		await openStep(page, backend.url, '/apps', 'apps');
		await page.waitForSelector('#apps .certificate-checking:not(.d-none)', { visible: true });
		await capture.step(page, 'apps', 'apps-certificate', PADDING);

		const expiredPage = await newPage(browser, viewport);
		await expiredPage.evaluateOnNewDocument((graceMs) => {
			const now = Date.now;
			const setTimer = window.setTimeout;
			let offset = 0;
			Date.now = () => { return now() + offset; };
			window.setTimeout = (callback, delay, ...args) => {
				if (delay > graceMs - 1000 && delay <= graceMs) {
					return setTimer(() => {
						offset += delay;
						callback(...args);
					}, 0);
				}

				return setTimer(callback, delay, ...args);
			};
		}, CERTIFICATE_GRACE_MS);
		await openStep(expiredPage, backend.url, '/apps', 'apps');
		await expiredPage.waitForSelector('#apps .certificate-warning:not(.d-none)', { visible: true });
		await sleep(SETTLE_MS);
		await capture.step(expiredPage, 'apps', 'apps-certificate-failed', PADDING);
		await closePage(expiredPage);

		backend.setState(nodeState(backend.getTopologies, readyForSignIn('univrs')));
		await openStep(page, backend.url, '/apps', 'apps');
		await waitForContinue(page);
		await capture.step(page, 'apps', 'apps', PADDING);
		await closePage(page);
	},
	password: async ({ browser, backend, capture, viewport }) => {
		backend.setState(nodeState(backend.getTopologies, readyForSignIn('univrs')));
		const page = await newPage(browser, viewport);
		await openStep(page, backend.url, '/apps', 'apps');
		await waitForContinue(page);
		await page.click('#apps [data-action="continue"]');
		await page.waitForSelector('#password:not(.d-none)', { visible: true });
		await sleep(SETTLE_MS);
		await setValue(page, '#password .password', OWNER_PASSWORD);
		await setValue(page, '#password .password-check', OWNER_PASSWORD);
		await capture.step(page, 'password', 'password', PADDING);
		await closePage(page);
	},
	finish: async ({ browser, backend, capture, viewport }) => {
		const page = await newPage(browser, viewport);
		backend.setState(nodeState(backend.getTopologies, readyForSignIn('univrs')));
		await openFinish(page, backend.url);
		await capture.step(page, 'finish', 'finish', PADDING);

		backend.setState(nodeState(backend.getTopologies, readyForSignIn('custom')));
		await openFinish(page, backend.url);
		await capture.step(page, 'finish', 'finish-custom', PADDING);
		await closePage(page);
	}
};

export default {
	name: 'setup',
	pages
};
