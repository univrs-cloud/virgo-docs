import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startBackend } from './backend.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_DIR = path.resolve(ROOT, process.env.VIRGO_UI || '../virgo-ui');
const API_DIR = path.resolve(ROOT, process.env.VIRGO_API || '../virgo-api');
const OUT_DIR = path.join(ROOT, 'src/assets/setup');
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PADDING = 50;
const SETTLE_MS = 600;
const CERTIFICATE_GRACE_MS = 60000;
const VIEWPORT = { width: 1280, height: 1100, deviceScaleFactor: 2 };

const sleep = (delay) => {
	return new Promise((resolve) => { setTimeout(resolve, delay); });
};

const openStep = async (page, url, pathname, step) => {
	await page.goto(`${url}${pathname}`, { waitUntil: 'load' });
	await page.waitForSelector(`#${step}:not(.d-none)`, { visible: true });
	await sleep(SETTLE_MS);
};

const followLink = async (page, pathname, step) => {
	await page.evaluate((pathname) => {
		const link = document.createElement('a');
		link.href = pathname;
		document.body.append(link);
		link.click();
		link.remove();
	}, pathname);
	await page.waitForSelector(`#${step}:not(.d-none)`, { visible: true });
	await sleep(SETTLE_MS);
};

const setValue = async (page, selector, value) => {
	await page.$eval(selector, (element, value) => { element.value = value; }, value);
	await sleep(SETTLE_MS);
	await page.$eval(selector, (element) => { element.error = ''; });
	await sleep(SETTLE_MS);
};

const written = new Set();

const captureStep = async (page, step, name) => {
	const box = await (await page.$(`#${step} > div`)).boundingBox();
	const top = await page.$eval('header .navbar', (element) => { return element.getBoundingClientRect().bottom; });
	const y = Math.max(top, box.y - PADDING);
	const clip = {
		x: Math.max(0, box.x - PADDING),
		y,
		width: box.width + PADDING * 2,
		height: box.y + box.height + PADDING - y
	};
	await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), clip, captureBeyondViewport: true });
	written.add(`${name}.png`);
	console.log(`  ${name}.png`);
};

const captureModal = async (page, name) => {
	const box = await (await page.$('.modal.show .modal-content')).boundingBox();
	const margin = PADDING;
	const clip = {
		x: box.x - margin,
		y: box.y - margin,
		width: box.width + margin * 2,
		height: box.height + margin * 2
	};
	await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), clip });
	written.add(`${name}.png`);
	console.log(`  ${name}.png`);
};

const run = async () => {
	const backend = await startBackend({ uiDir: UI_DIR, apiDir: API_DIR });
	const browser = await puppeteer.launch({
		executablePath: CHROME_PATH,
		headless: true,
		defaultViewport: VIEWPORT
	});

	try {
		fs.mkdirSync(OUT_DIR, { recursive: true });
		const page = await browser.newPage();
		const { url, state } = backend;

		await page.setViewport({ ...VIEWPORT, height: 820 });
		await openStep(page, url, '/', 'welcome');
		await captureStep(page, 'welcome', 'welcome');
		await page.setViewport(VIEWPORT);

		await openStep(page, url, '/network/interface', 'interface');
		await captureStep(page, 'interface', 'interface');

		await openStep(page, url, '/network/host', 'host');
		await page.waitForFunction(() => {
			return document.querySelector('#host .availability-message')?.textContent === 'This name is available';
		});
		await sleep(SETTLE_MS);
		await captureStep(page, 'host', 'host');

		await openStep(page, url, '/network/ports', 'ports');
		await captureStep(page, 'ports', 'ports');

		await openStep(page, url, '/storage', 'storage');
		await page.waitForSelector('#storage .summary:not(.d-none)');
		await captureStep(page, 'storage', 'storage');

		await page.click('#storage [data-action="create"]');
		await page.waitForSelector('.modal.show', { visible: true });
		await sleep(SETTLE_MS);
		await captureModal(page, 'storage-confirm');

		state.storage = [backend.createPool(state.topologies[0])];
		await openStep(page, url, '/storage', 'storage');
		await page.waitForSelector('#storage [data-action="continue"]:not(.d-none)');
		await captureStep(page, 'storage', 'storage-pool');

		await openStep(page, url, '/fleet', 'fleet');
		await setValue(page, '#fleet .email', 'univrs@gmail.com');
		await setValue(page, '#fleet .password', 'q7Rt2Vx9Lm4Kp8Zw');
		await captureStep(page, 'fleet', 'fleet');

		state.configuration = { fleet: { email: 'univrs@gmail.com', token: 'example-token', enabled: true, connected: true } };
		await openStep(page, url, '/fleet', 'fleet');
		await captureStep(page, 'fleet', 'fleet-registered');

		state.jobs = [backend.downloadingJob('wetty', 40), backend.queuedJob('authelia'), backend.queuedJob('traefik')];
		await openStep(page, url, '/apps', 'apps');
		await captureStep(page, 'apps', 'apps-terminal');

		state.jobs = [backend.downloadingJob('authelia', 65), backend.queuedJob('traefik')];
		Object.assign(state, backend.runningApps(['wetty']));
		await openStep(page, url, '/apps', 'apps');
		await captureStep(page, 'apps', 'apps-authelia');

		state.jobs = [backend.installingJob('traefik')];
		Object.assign(state, backend.runningApps(['wetty', 'authelia']));
		await openStep(page, url, '/apps', 'apps');
		await captureStep(page, 'apps', 'apps-traefik');

		state.jobs = [];
		Object.assign(state, backend.runningApps(['wetty', 'authelia', 'traefik']));
		state.certificate = { required: true, hasCertificate: false, resolves: true, fqdn: state.system.osInfo.fqdn };
		await openStep(page, url, '/apps', 'apps');
		await page.waitForSelector('#apps .certificate-checking:not(.d-none)', { visible: true });
		await captureStep(page, 'apps', 'apps-certificate');

		const expiredPage = await browser.newPage();
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
		await openStep(expiredPage, url, '/apps', 'apps');
		await expiredPage.waitForSelector('#apps .certificate-warning:not(.d-none)', { visible: true });
		await sleep(SETTLE_MS);
		await captureStep(expiredPage, 'apps', 'apps-certificate-failed');
		await expiredPage.close();

		state.certificate = { ...state.certificate, hasCertificate: true };
		await openStep(page, url, '/apps', 'apps');
		await page.waitForFunction(() => {
			return !document.querySelector('#apps [data-action="continue"]')?.disabled;
		});
		await sleep(SETTLE_MS);
		await captureStep(page, 'apps', 'apps');

		await page.click('#apps [data-action="continue"]');
		await page.waitForSelector('#password:not(.d-none)', { visible: true });
		await sleep(SETTLE_MS);
		await setValue(page, '#password .password', 'n3Fh8Qs1Wd6Yb2Jc');
		await setValue(page, '#password .password-check', 'n3Fh8Qs1Wd6Yb2Jc');
		await captureStep(page, 'password', 'password');

		await followLink(page, '/finish', 'finish');
		await captureStep(page, 'finish', 'finish');

		state.system.osInfo.fqdn = 'spica.virgo.mydomain.com';
		state.certificate = { ...state.certificate, fqdn: state.system.osInfo.fqdn };
		await openStep(page, url, '/network/host', 'host');
		await page.waitForSelector('#host .dns-record:not(.d-none)', { visible: true });
		await captureStep(page, 'host', 'host-custom');

		state.configuration = { fleet: {} };
		await openStep(page, url, '/fleet', 'fleet');
		await page.waitForSelector('#fleet [data-action="skip"]:not(.d-none)', { visible: true });
		await setValue(page, '#fleet .email', 'univrs@gmail.com');
		await setValue(page, '#fleet .password', 'q7Rt2Vx9Lm4Kp8Zw');
		await captureStep(page, 'fleet', 'fleet-custom');

		await openStep(page, url, '/apps', 'apps');
		await page.waitForFunction(() => {
			return !document.querySelector('#apps [data-action="continue"]')?.disabled;
		});
		await page.click('#apps [data-action="continue"]');
		await page.waitForSelector('#password:not(.d-none)', { visible: true });
		await followLink(page, '/finish', 'finish');
		await captureStep(page, 'finish', 'finish-custom');
	} finally {
		await browser.close();
		backend.close();
	}

	for (const file of fs.readdirSync(OUT_DIR)) {
		if (!written.has(file)) {
			fs.rmSync(path.join(OUT_DIR, file));
		}
	}

	console.log(`Wrote screenshots to ${path.relative(ROOT, OUT_DIR)}.`);
};

await run();
