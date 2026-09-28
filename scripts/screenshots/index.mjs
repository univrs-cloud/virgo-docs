import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startBackend } from './backend.mjs';
import { createCapture } from './capture.mjs';
import setup from './scenes/setup.mjs';
import management from './scenes/management.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_DIR = path.resolve(ROOT, process.env.VIRGO_UI || '../virgo-ui');
const API_DIR = path.resolve(ROOT, process.env.VIRGO_API || '../virgo-api');
const APPS_DIR = path.resolve(ROOT, process.env.VIRGO_APPS || '../virgo-apps');
const ASSETS_DIR = path.join(ROOT, 'src/assets');
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { width: 1440, height: 1100, deviceScaleFactor: 2 };
const SECTIONS = [setup, management];

const available = () => {
	return SECTIONS.flatMap((section) => {
		return [section.name, ...Object.keys(section.pages).map((page) => { return `${section.name}/${page}`; })];
	}).join(', ');
};

const plan = (targets) => {
	if (targets.length === 0) {
		return SECTIONS.map((section) => { return { section, pages: Object.keys(section.pages), isComplete: true }; });
	}

	const selected = new Map();
	for (const target of targets) {
		const [sectionName, pageName] = target.toLowerCase().split('/');
		const section = SECTIONS.find((candidate) => { return candidate.name === sectionName; });
		if (!section || (pageName && !section.pages[pageName])) {
			throw new Error(`Unknown target "${target}". Available: ${available()}.`);
		}

		const pages = selected.get(section) || new Set();
		for (const name of (pageName ? [pageName] : Object.keys(section.pages))) {
			pages.add(name);
		}
		selected.set(section, pages);
	}

	return [...selected].map(([section, pages]) => {
		const ordered = Object.keys(section.pages).filter((name) => { return pages.has(name); });
		return { section, pages: ordered, isComplete: ordered.length === Object.keys(section.pages).length };
	});
};

const run = async () => {
	const runs = plan(process.argv.slice(2));
	const backend = await startBackend({ uiDir: UI_DIR, apiDir: API_DIR, appsDir: APPS_DIR });
	const browser = await puppeteer.launch({
		executablePath: CHROME_PATH,
		headless: true,
		defaultViewport: VIEWPORT
	});
	const completed = [];

	try {
		for (const { section, pages, isComplete } of runs) {
			const capture = createCapture(path.join(ASSETS_DIR, section.name));
			for (const name of pages) {
				await section.pages[name]({ browser, backend, capture, viewport: VIEWPORT });
			}
			if (isComplete) {
				completed.push(capture);
			}
		}
	} finally {
		await browser.close();
		backend.close();
	}

	for (const capture of completed) {
		capture.prune();
	}

	console.log(`Wrote screenshots to ${path.relative(ROOT, ASSETS_DIR)}.`);
};

await run();
