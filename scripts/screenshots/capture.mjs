import fs from 'node:fs';
import path from 'node:path';

const SETTLE_MS = 600;

const sleep = (delay) => {
	return new Promise((resolve) => { setTimeout(resolve, delay); });
};

const FROZEN_ANIMATIONS = '*, *::before, *::after { animation-delay: -0.35s !important; animation-play-state: paused !important; transition: none !important; caret-color: transparent !important; }';

const newPage = async (browser, viewport) => {
	const context = await browser.createBrowserContext();
	const page = await context.newPage();
	await page.setViewport(viewport);
	await page.evaluateOnNewDocument((css) => {
		document.addEventListener('DOMContentLoaded', () => {
			const style = document.createElement('style');
			style.textContent = css;
			document.head.append(style);
		});
	}, FROZEN_ANIMATIONS);
	return page;
};

const controlClock = async (page, startAt = null) => {
	await page.evaluateOnNewDocument((startAt) => {
		const now = Date.now;
		window.__clockOffset = (startAt === null ? 0 : startAt - now());
		Date.now = () => { return now() + window.__clockOffset; };
	}, startAt);
};

const advanceClock = async (page, milliseconds) => {
	await page.evaluate((milliseconds) => { window.__clockOffset += milliseconds; }, milliseconds);
};

const closePage = async (page) => {
	await page.browserContext().close();
};

const open = async (page, url, pathname, selector) => {
	await page.goto(`${url}${pathname}`, { waitUntil: 'load' });
	await page.waitForSelector(selector, { visible: true });
	await sleep(SETTLE_MS);
};

const setValue = async (page, selector, value) => {
	await page.$eval(selector, (element, value) => { element.value = value; }, value);
	await sleep(SETTLE_MS);
	await page.$eval(selector, (element) => { element.error = ''; });
	await sleep(SETTLE_MS);
};

const followLink = async (page, pathname, selector) => {
	await page.evaluate((pathname) => {
		const link = document.createElement('a');
		link.href = pathname;
		document.body.append(link);
		link.click();
		link.remove();
	}, pathname);
	await page.waitForSelector(selector, { visible: true });
	await sleep(SETTLE_MS);
};

const openMenu = async (page, toggle, menu) => {
	await page.click(toggle);
	await page.waitForSelector(menu, { visible: true });
	await sleep(SETTLE_MS);
};

const openModal = async (page, trigger, modal) => {
	await page.click(trigger);
	await page.waitForSelector(`${modal}.show`, { visible: true });
	await sleep(SETTLE_MS);
};

const closeModal = async (page, modal) => {
	await page.click(`${modal} [data-bs-dismiss="modal"]`);
	await page.waitForSelector(`${modal}.show`, { hidden: true });
	await sleep(SETTLE_MS);
};

const unionBox = async (page, selectors) => {
	const boxes = [];
	for (const selector of selectors) {
		const handle = await page.$(selector);
		const box = await handle?.boundingBox();
		if (box) {
			boxes.push(box);
		}
	}

	if (boxes.length === 0) {
		throw new Error(`Nothing to capture for ${selectors.join(', ')}.`);
	}

	const left = Math.min(...boxes.map((box) => { return box.x; }));
	const top = Math.min(...boxes.map((box) => { return box.y; }));
	const right = Math.max(...boxes.map((box) => { return box.x + box.width; }));
	const bottom = Math.max(...boxes.map((box) => { return box.y + box.height; }));
	return { x: left, y: top, width: right - left, height: bottom - top };
};

const sides = (padding) => {
	if (typeof padding === 'number') {
		return { top: padding, right: padding, bottom: padding, left: padding };
	}

	return padding;
};

const clipAround = (box, padding, viewport, minTop = 0) => {
	const { top, right, bottom, left } = sides(padding);
	const x = Math.max(0, box.x - left);
	const y = Math.max(minTop, box.y - top);
	const edge = Math.min(viewport.width, box.x + box.width + right);
	return { x, y, width: edge - x, height: box.y + box.height + bottom - y };
};

const createCapture = (outDir) => {
	const written = new Set();
	fs.mkdirSync(outDir, { recursive: true });

	const save = async (page, name, options) => {
		await page.screenshot({ path: path.join(outDir, `${name}.png`), ...options });
		written.add(`${name}.png`);
		console.log(`  ${path.basename(outDir)}/${name}.png`);
	};

	return {
		step: async (page, step, name, padding) => {
			const box = await unionBox(page, [`#${step} > div`]);
			const top = await page.$eval('header .navbar', (element) => { return element.getBoundingClientRect().bottom; });
			await save(page, name, { clip: clipAround(box, padding, page.viewport(), top), captureBeyondViewport: true });
		},
		region: async (page, selectors, name, padding) => {
			const box = await unionBox(page, selectors);
			const clip = clipAround(box, padding, page.viewport());
			await save(page, name, { clip, captureBeyondViewport: (clip.y + clip.height > page.viewport().height) });
		},
		viewport: async (page, name) => {
			const { width, height } = page.viewport();
			await save(page, name, { clip: { x: 0, y: 0, width, height }, captureBeyondViewport: false });
		},
		fullPage: async (page, name) => {
			const viewport = page.viewport();
			const height = await page.evaluate(() => { return Math.ceil(document.documentElement.scrollHeight); });
			if (height > viewport.height) {
				await page.setViewport({ ...viewport, height });
				await sleep(SETTLE_MS);
			}

			await save(page, name);
			await page.setViewport(viewport);
		},
		prune: () => {
			for (const file of fs.readdirSync(outDir)) {
				if (!written.has(file)) {
					fs.rmSync(path.join(outDir, file));
				}
			}
		}
	};
};

export {
	SETTLE_MS,
	sleep,
	newPage,
	closePage,
	controlClock,
	advanceClock,
	open,
	setValue,
	followLink,
	openMenu,
	openModal,
	closeModal,
	createCapture
};
