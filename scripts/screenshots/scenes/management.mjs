import { SETTLE_MS, sleep, newPage, closePage, controlClock, advanceClock, open, setValue, openMenu, openModal, closeModal } from '../capture.mjs';
import * as apps from '../data/apps.mjs';
import { DOMAINS, fqdn } from '../data/network.mjs';
import { nodeState } from '../data/node.mjs';
import { networkHistory, upsCharging, upsOnBattery, upsMissing, upsUnreachable, upsFailed } from '../data/status.mjs';
import * as serviceData from '../data/services.mjs';
import * as settings from '../data/settings.mjs';
import * as shares from '../data/shares.mjs';
import * as shortcuts from '../data/shortcuts.mjs';
import * as updates from '../data/updates.mjs';
import * as users from '../data/users.mjs';

const PADDING = 32;
const ACCOUNT_MENU_PADDING = { top: 12, right: PADDING, bottom: 8, left: PADDING };
const DASHBOARD_HEIGHT = 960;
const IN_USE_POOL_PERCENT = 34;
const VISIBLE_ACCOUNT = 'header .account:not(.d-sm-none)';

const managedNode = (backend, overrides = {}) => {
	return nodeState(backend.getTopologies, {
		setupCompleted: true,
		poolUsedPercent: IN_USE_POOL_PERCENT,
		isRegistered: true,
		certificateIssued: true,
		runningApps: apps.CORE_APP_NAMES,
		userList: users.USERS,
		withStatus: true,
		...overrides
	});
};

const NETWORK_SAMPLE_MS = 1000;
const NETWORK_EMIT_GAP_MS = 25;

const fillNetworkHistory = async (page, backend) => {
	for (const sample of networkHistory()) {
		await advanceClock(page, NETWORK_SAMPLE_MS);
		backend.broadcast('/host', 'host:network:stats', sample);
		await sleep(NETWORK_EMIT_GAP_MS);
	}

	await sleep(SETTLE_MS);
};

const signedInPage = async (browser, backend, viewport, user) => {
	const page = await newPage(browser, { ...viewport, height: DASHBOARD_HEIGHT });
	await page.setCookie(users.accountCookie(backend.url, user));
	return page;
};

const SETTINGS_PAGE = '#settings .container-fluid:not(.d-none)';
const CARD_PADDING = { top: PADDING, right: PADDING, bottom: PADDING, left: 8 };
const FLEET_CARD = '#settings .row > .col-12:nth-child(1) .card';

const NETWORK_PAGE = '#network .container-fluid:not(.d-none)';
const networkCard = (index) => { return `#network .container-fluid > .row > .col-12:nth-child(${index}) .card`; };
const TRUSTED_PROXY = '192.168.1.5';

const SERVICES_PAGE = '#system-services .container-fluid:not(.d-none)';
const SERVICES_FILTER = '#system-services .dropdown:has(.filter-menu)';

const searchServices = async (page, value) => {
	await page.$eval('#system-services .search', (element, value) => {
		element.value = value;
		element.dispatchEvent(new Event('input', { bubbles: true }));
	}, value);
	await sleep(SETTLE_MS);
};

const STORAGE_PAGE = '#storage .container-fluid:not(.d-none)';
const STORAGE_POOL = '#storage .details .item';
const poolCard = (index) => { return `#storage .details .overflow-y-scroll > .card:nth-child(${index})`; };
const VDEV_DETAILS = '#storage .details [id^="vdev-details-"].show';
const SNAPSHOT_COUNT = 142;
const POOL_CARD_PADDING = { top: 8, right: PADDING, bottom: 8, left: 8 };

const storageNode = (backend, overrides = {}) => {
	return managedNode(backend, { now: settings.WEATHER_CLOCK, scrub: 'finished', snapshotCount: SNAPSHOT_COUNT, ...overrides });
};

const storagePage = async (browser, backend, viewport) => {
	const page = await signedInPage(browser, backend, viewport, users.owner());
	await controlClock(page, settings.WEATHER_CLOCK);
	return page;
};

const TIGHT_PADDING = 12;
const UPS_ROW = '#resources-monitor .ups';
const UPS_BADGE = `${UPS_ROW} u-badge`;
const UPS_FAULT = `${UPS_ROW} h6 small`;
const FLUSH_TOP_PADDING = { top: 0, right: TIGHT_PADDING, bottom: TIGHT_PADDING, left: TIGHT_PADDING };
const REORDER_GROUP = '#apps-shortcuts .group:nth-child(2)';

const DRAG_IMAGE_OFFSET = { x: 90, y: 34 };
const windowToggle = (label) => { return `#apps-shortcuts .open-window[data-label="${label}"]`; };
const WINDOW_TOGGLE = windowToggle(apps.WINDOW_APP);
const DOCKED_APPS = ['Nextcloud', 'Gitea'];
const WINDOW_ENTRY = 'header .navbar .nav .nav-window';
const MENU_TOGGLE = 'header nav .menu-toggle';
const MENU_ITEM = 'header nav a[href="/storage"]';

const serveWindowPage = async (page, urls) => {
	await page.setRequestInterception(true);
	page.on('request', (request) => {
		if (urls.some((url) => { return request.url().toLowerCase().startsWith(url.toLowerCase()); })) {
			request.respond({ contentType: 'text/html', body: apps.windowPage() });
			return;
		}

		request.continue();
	});
};

const showDragImage = (card, pointer, offset) => {
	const box = card.getBoundingClientRect();
	const image = card.cloneNode(true);
	image.classList.add('drag-image');
	Object.assign(image.style, {
		position: 'fixed',
		left: `${pointer.x - box.width / 2 + offset.x}px`,
		top: `${pointer.y - box.height / 2 + offset.y}px`,
		width: `${box.width}px`,
		opacity: '1',
		background: '#FFFFFF',
		boxShadow: '0 14px 32px rgba(0, 0, 0, 0.22)',
		pointerEvents: 'none',
		zIndex: '2000'
	});
	document.body.append(image);
};

const centerOf = (element) => {
	const box = element.getBoundingClientRect();
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const APPS_PAGE = '#apps .container-fluid:not(.d-none)';
const APP_CENTER_READY = '#app-center .tab-content:not(.d-none)';
const appRow = (name) => { return `#apps tr[data-name="${name}"]`; };
const appService = (id) => { return `#apps .details .service[data-id="${id}"]`; };
const APP_FILTER_MENU = '#apps .app-filters .dropdown-menu.show';
const SNAPSHOTS_TAB = '#apps .details [data-app-tab="snapshots"]';
const SNAPSHOT_SEARCH = '#apps .details .snapshot-search';
const SNAPSHOT_RESULTS = '#apps .details .snapshots .card-body:has(.snapshot-search-clear)';
const SNAPSHOT_DOWNLOADS = `${SNAPSHOT_RESULTS} .dropdown-menu.show`;
const SNAPSHOT_RESTORE = '#snapshot-restore';
const SNAPSHOT_RESTORE_CONFLICT = '#snapshot-restore-conflict';
const SNAPSHOT_BROWSER = '#snapshot-browser';
const BROWSER_HEIGHT = 760;
const browseCheck = (path) => { return `${SNAPSHOT_BROWSER} .browse-check[data-path="${path}"]`; };

const appsNode = (backend, { names = apps.CORE_APP_NAMES, updatable = null, jobs = [], domain = 'univrs' } = {}) => {
	const appState = apps.installed({ appsDir: backend.appsDir, parseYaml: backend.parseYaml, fqdn: fqdn(domain), domainName: DOMAINS[domain], names, updatable });
	return {
		...managedNode(backend, { jobs, domain }),
		...appState,
		snapshots: Object.assign({}, ...names.map((name) => { return apps.appSnapshots(name); })),
		containerLogs: apps.containerLogs(settings.WEATHER_CLOCK),
		containerTerminal: apps.containerTerminal()
	};
};

const appsPage = async (browser, backend, viewport) => {
	const page = await signedInPage(browser, backend, viewport, users.owner());
	await controlClock(page, settings.WEATHER_CLOCK);
	await open(page, backend.url, '/apps', APPS_PAGE);
	await waitForImages(page, '#apps tbody img');
	return page;
};

const openAppCenter = async (page) => {
	await openModal(page, '#apps a[href="#app-center"]', '#app-center');
	await page.waitForSelector(APP_CENTER_READY, { visible: true });
	await waitForImages(page, '#app-center #app-center-explore img');
};

const SHORTCUTS_PAGE = '#shortcuts .container-fluid:not(.d-none)';
const ICON_POPOVER = '#shortcut-create .shortcut-icon-box .popover';
const shortcutRow = (shortcut) => { return `#shortcuts tr[data-name="${shortcut.name}"]`; };

const shortcutsNode = (backend) => {
	return managedNode(backend, { shortcutList: shortcuts.shortcuts(DOMAINS.univrs) });
};

const waitForImages = async (page, selector) => {
	await page.waitForFunction((selector) => {
		const images = [...document.querySelectorAll(selector)];
		return images.length > 0 && images.every((image) => { return image.complete && image.naturalWidth > 0; });
	}, {}, selector);
	await sleep(SETTLE_MS);
};

const openShortcutCreate = async (browser, backend, viewport) => {
	const page = await signedInPage(browser, backend, viewport, users.owner());
	await open(page, backend.url, '/shortcuts', SHORTCUTS_PAGE);
	await openModal(page, '#shortcuts a[href="#shortcut-create"]', '#shortcut-create');
	return page;
};

const FOLDERS_PAGE = '#folders .container-fluid:not(.d-none)';
const FOLDER_CREATE_READY = '#folder-create .content:not(.d-none)';
const folderRow = (share) => { return `#folders tr[data-id="${share.name}"]`; };

const foldersNode = (backend) => {
	return { ...managedNode(backend, { shareList: shares.folders() }), customPaths: shares.customPaths() };
};

const fillFolder = async (page, folder) => {
	if (folder.path) {
		await setValue(page, '#folder-create .path', folder.path);
	}
	await setValue(page, '#folder-create .comment', folder.comment);
	await page.$$eval('#folder-create .valid-users u-checkbox', (checkboxes, users) => {
		for (const checkbox of checkboxes) {
			checkbox.checked = users.includes(checkbox.onValue);
		}
	}, folder.users);
	if (folder.capacity) {
		await setValue(page, '#folder-create .refquota', folder.capacity);
	}
};

const TIME_MACHINES_PAGE = '#time-machines .container-fluid:not(.d-none)';
const DASHBOARD_GROUP_PADDING = { top: 12, right: 16, bottom: 16, left: 16 };
const timeMachineRow = (share) => { return `#time-machines tr[data-id="${share.name}"]`; };

const hoverTooltip = async (page, selector) => {
	await page.hover(selector);
	await page.waitForSelector('.tooltip.show', { visible: true });
	await sleep(SETTLE_MS);
};

const UPDATES_PAGE = '#system-updates .container-fluid:not(.d-none)';
const MENU_PADDING = { top: 4, right: 16, bottom: 8, left: 16 };

const pages = {
	authentication: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend));
		const page = await newPage(browser, { ...viewport, height: DASHBOARD_HEIGHT });
		await open(page, backend.url, '/login', 'main .username');
		await setValue(page, 'main .username', users.owner().username);
		await setValue(page, 'main .password', users.OWNER_PASSWORD);
		await capture.viewport(page, 'login');

		await closePage(page);

		const dashboard = await newPage(browser, { ...viewport, height: DASHBOARD_HEIGHT });
		await controlClock(dashboard);
		await open(dashboard, backend.url, '/', `${VISIBLE_ACCOUNT} a[href^="/login"]`);
		await dashboard.waitForSelector('#resources-monitor .network-chart', { visible: true });
		await fillNetworkHistory(dashboard, backend);
		await capture.viewport(dashboard, 'local');
		await closePage(dashboard);

		const signedIn = await signedInPage(browser, backend, viewport, users.owner());
		await open(signedIn, backend.url, '/', `${VISIBLE_ACCOUNT} .account-toggle`);
		await openMenu(signedIn, `${VISIBLE_ACCOUNT} .account-toggle`, `${VISIBLE_ACCOUNT} .dropdown-menu.show`);
		await capture.region(signedIn, [`${VISIBLE_ACCOUNT} .dropdown-menu.show`, `${VISIBLE_ACCOUNT} .account-toggle`], 'account-menu', ACCOUNT_MENU_PADDING);
		await closePage(signedIn);
	},
	apps: async ({ browser, backend, capture, viewport }) => {
		const example = `#app-center .item[data-name="${apps.EXAMPLE_APP}"]`;
		const exampleContainer = `${apps.EXAMPLE_APP}-${apps.EXAMPLE_APP}`;
		backend.setState(appsNode(backend));
		const page = await appsPage(browser, backend, viewport);
		await capture.viewport(page, 'apps');

		await openMenu(page, '#apps .app-filters .dropdown:nth-child(2) [data-bs-toggle="dropdown"]', APP_FILTER_MENU);
		await capture.region(page, ['#apps .search', '#apps .app-filters', '#apps table', APP_FILTER_MENU], 'apps-filter', PADDING);
		await page.keyboard.press('Escape');
		await sleep(SETTLE_MS);

		await openAppCenter(page);
		await capture.region(page, ['#app-center .modal-content'], 'app-center', PADDING);

		await page.click(`${example} .install`);
		await page.waitForSelector('#app-install.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(page, ['#app-install .modal-content'], 'app-install', PADDING);
		await closePage(page);

		backend.setState(appsNode(backend, { domain: 'custom' }));
		const custom = await appsPage(browser, backend, viewport);
		await openAppCenter(custom);
		await custom.click(`${example} .install`);
		await custom.waitForSelector('#app-install.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(custom, ['#app-install .modal-content'], 'app-install-custom', PADDING);
		await closePage(custom);

		backend.setState(appsNode(backend, { jobs: [apps.installingJobFor()] }));
		const installing = await appsPage(browser, backend, viewport);
		await openAppCenter(installing);
		await capture.region(installing, [example], 'app-center-installing', TIGHT_PADDING);
		await closePage(installing);

		backend.setState(appsNode(backend, { names: [...apps.CORE_APP_NAMES, apps.EXAMPLE_APP], updatable: apps.EXAMPLE_APP }));
		const installed = await appsPage(browser, backend, viewport);
		await openMenu(installed, `${appRow(apps.EXAMPLE_APP)} .dropdown-toggle`, '#apps .dropdown-menu.show');
		await capture.region(installed, ['#apps .search', '#apps table', '#apps .dropdown-menu.show'], 'apps-menu', PADDING);
		await installed.keyboard.press('Escape');
		await sleep(SETTLE_MS);

		await open(installed, backend.url, `/apps/${apps.EXAMPLE_APP}`, '#apps .details .item');
		await waitForImages(installed, '#apps .details img');
		await installed.mouse.move(0, 0);
		await capture.viewport(installed, 'app-details');

		await installed.click(`${appService(exampleContainer)} a.logs`);
		await installed.waitForSelector('#apps .details .logs-container:not(.d-none) li', { visible: true });
		await sleep(SETTLE_MS);
		await capture.viewport(installed, 'app-logs');
		await installed.click('#apps .details .close-logs');
		await sleep(SETTLE_MS);

		await installed.click(`${appService(exampleContainer)} a.terminal`);
		await installed.waitForSelector('#apps .details .terminal-container:not(.d-none) .xterm', { visible: true });
		await sleep(SETTLE_MS * 2);
		await capture.viewport(installed, 'app-terminal');
		await installed.click('#apps .details .close-terminal');
		await sleep(SETTLE_MS);

		await closePage(installed);

		const title = 'Nextcloud';
		backend.setState(appsNode(backend, { names: [...apps.CORE_APP_NAMES, apps.EXAMPLE_APP], updatable: apps.EXAMPLE_APP, jobs: [apps.updatingJob(title)] }));
		const updating = await appsPage(browser, backend, viewport);
		await updating.waitForSelector(`${appRow(apps.EXAMPLE_APP)} .icon-gear`, { visible: true });
		await sleep(SETTLE_MS);
		await capture.viewport(updating, 'app-updating');

		backend.broadcast('/docker', 'app:updates', []);
		backend.broadcast('/job', 'job', apps.updatedJob(title));
		await updating.waitForSelector(`${appRow(apps.EXAMPLE_APP)} .dropdown-toggle`, { visible: true });
		await sleep(SETTLE_MS);
		await capture.viewport(updating, 'app-updated');
		await closePage(updating);
	},
	snapshots: async ({ browser, backend, capture, viewport }) => {
		backend.setState({ ...appsNode(backend, { names: [...apps.CORE_APP_NAMES, apps.EXAMPLE_APP] }), snapshotSearch: apps.snapshotSearch(), restoreFolders: apps.restoreFolders(), restoreInspection: apps.restoreInspection(), browseListings: apps.browseListings() });
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await controlClock(page, apps.SNAPSHOT_CLOCK);
		await open(page, backend.url, `/apps/${apps.EXAMPLE_APP}`, '#apps .details .item');
		await waitForImages(page, '#apps .details img');
		await page.click(SNAPSHOTS_TAB);
		await page.waitForSelector('#apps .details .snapshots', { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.viewport(page, 'app-snapshots');

		await setValue(page, SNAPSHOT_SEARCH, apps.SNAPSHOT_SEARCH_TERM);
		await page.$eval(SNAPSHOT_SEARCH, (element) => { element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true })); });
		await page.waitForSelector(SNAPSHOT_RESULTS, { visible: true });
		await sleep(SETTLE_MS);
		const resultsBottom = await page.$eval(SNAPSHOT_RESULTS, (element) => { return Math.ceil(element.getBoundingClientRect().bottom); });
		await page.setViewport({ ...viewport, height: Math.max(viewport.height, resultsBottom + PADDING) });
		await sleep(SETTLE_MS);
		await capture.region(page, ['#apps .details .snapshots .card-body:has(.snapshot-search)', SNAPSHOT_RESULTS], 'app-snapshots-search', FLUSH_TOP_PADDING);

		const folderDownloads = await page.$$(`${SNAPSHOT_RESULTS} .tree-rows [data-bs-toggle="dropdown"]`);
		await folderDownloads.at(-1).click();
		await page.waitForSelector(SNAPSHOT_DOWNLOADS, { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(page, [SNAPSHOT_RESULTS], 'app-snapshots-download', FLUSH_TOP_PADDING);
		await page.keyboard.press('Escape');

		const resultsViewport = page.viewport();
		await page.setViewport({ ...viewport, height: BROWSER_HEIGHT });
		await page.$eval(`${SNAPSHOT_RESULTS} .snapshot-browse[data-browse-snapshot="${apps.BROWSE_SNAPSHOT}"][data-browse-focus="${apps.BROWSE_FILE}"]`, (element) => { element.click(); });
		await page.waitForSelector(`${SNAPSHOT_BROWSER}.show ${'.browse-check'}:checked`, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_BROWSER} .modal-content`], 'app-snapshots-browse', PADDING);

		const crumbToggles = await page.$$(`${SNAPSHOT_BROWSER} .breadcrumb [data-bs-toggle="dropdown"]`);
		await crumbToggles.at(-1).click();
		await page.waitForSelector(`${SNAPSHOT_BROWSER} .breadcrumb .dropdown-menu.show`, { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_BROWSER} .modal-content`], 'app-snapshots-browse-folders', PADDING);
		await page.keyboard.press('Escape');

		await page.click(`${SNAPSHOT_BROWSER} thead [data-bs-toggle="dropdown"][data-bs-auto-close="outside"]`);
		await page.waitForSelector(`${SNAPSHOT_BROWSER} thead .dropdown-menu.show`, { visible: true });
		await page.click(`${SNAPSHOT_BROWSER} .browse-filter[value="deleted"]`);
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_BROWSER} .modal-content`], 'app-snapshots-browse-filter', PADDING);
		await page.click(`${SNAPSHOT_BROWSER} .browse-filter-clear`);
		await page.keyboard.press('Escape');

		await page.click(browseCheck(apps.BROWSE_FILE));
		for (const pick of apps.BROWSE_PICKS) {
			await page.click(browseCheck(pick));
		}
		await page.$eval(`${SNAPSHOT_BROWSER} .browse-go[data-path="${apps.BROWSE_SUBFOLDER}"]`, (element) => { element.click(); });
		await page.waitForSelector(browseCheck(apps.BROWSE_EXCEPTION), { visible: true });
		await page.click(`${SNAPSHOT_BROWSER} .browse-check-all`);
		await page.click(browseCheck(apps.BROWSE_EXCEPTION));
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_BROWSER} .modal-content`], 'app-snapshots-browse-select', PADDING);

		await page.click(`${SNAPSHOT_BROWSER} .modal-footer .browse-collection`);
		await page.waitForSelector(`${SNAPSHOT_BROWSER} .browse-expand`, { visible: true });
		const expandable = await page.$$eval(`${SNAPSHOT_BROWSER} .browse-expand`, (elements) => { return elements.map((element) => { return element.dataset.path; }); });
		for (const expandPath of expandable) {
			await page.click(`${SNAPSHOT_BROWSER} .browse-expand[data-path="${expandPath}"]`);
		}
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_BROWSER} .modal-content`], 'app-snapshots-browse-selected', PADDING);

		await page.click(`${SNAPSHOT_BROWSER} .browse-restore`);
		await page.waitForSelector(`${SNAPSHOT_RESTORE}.show .restore-folders .restore-folder`, { visible: true });
		await page.$eval(`${SNAPSHOT_RESTORE} .restore-folder[data-path="/data/olivia/files"] > .tree-row .folder-toggle`, (element) => { element.click(); });
		await page.waitForSelector(`${SNAPSHOT_RESTORE} .restore-folder[data-path="${apps.RESTORE_FOLDER}"]`, { visible: true });
		await page.$eval(`${SNAPSHOT_RESTORE} .restore-folder[data-path="${apps.RESTORE_FOLDER}"] > .tree-row .folder-select`, (element) => { element.click(); });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_RESTORE} .modal-content`], 'app-snapshots-restore-selection', PADDING);
		await page.click(`${SNAPSHOT_RESTORE} [data-bs-dismiss="modal"]`);
		await page.waitForSelector(SNAPSHOT_RESTORE, { hidden: true });
		await page.click(`${SNAPSHOT_BROWSER} .modal-footer [data-bs-dismiss="modal"]`);
		await page.waitForSelector(SNAPSHOT_BROWSER, { hidden: true });
		await page.setViewport(resultsViewport);
		await sleep(SETTLE_MS);

		await page.$eval(`${SNAPSHOT_RESULTS} .snapshot-restore[data-path$="${apps.RESTORE_SNAPSHOT}${apps.RESTORE_FILE}"]`, (element) => { element.click(); });
		await page.waitForSelector(`${SNAPSHOT_RESTORE}.show .restore-folders .bg-primary-subtle`, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_RESTORE} .modal-content`], 'app-snapshots-restore', PADDING);

		await page.click(`${SNAPSHOT_RESTORE} .restore-submit`);
		await page.waitForSelector(`${SNAPSHOT_RESTORE_CONFLICT}.show .restore-confirm`, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_RESTORE_CONFLICT} .modal-content`], 'app-snapshots-restore-conflict', PADDING);

		await page.click(`${SNAPSHOT_RESTORE_CONFLICT} [data-bs-dismiss="modal"]`);
		await page.waitForSelector(SNAPSHOT_RESTORE_CONFLICT, { hidden: true });
		await page.$eval(`${SNAPSHOT_RESTORE} .restore-folder[data-path="${apps.RESTORE_FOLDER}"] > .tree-row .folder-add`, (element) => { element.click(); });
		await page.waitForSelector(`${SNAPSHOT_RESTORE} .folder-name`, { visible: true });
		await page.type(`${SNAPSHOT_RESTORE} .folder-name`, apps.RESTORE_NEW_FOLDER);
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_RESTORE} .modal-content`], 'app-snapshots-restore-folder-name', PADDING);

		await page.click(`${SNAPSHOT_RESTORE} .draft-add`);
		await page.waitForSelector(`${SNAPSHOT_RESTORE} .folder-remove`, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [`${SNAPSHOT_RESTORE} .modal-content`], 'app-snapshots-restore-folder-new', PADDING);
		await closePage(page);
	},
	dashboard: async ({ browser, backend, capture, viewport }) => {
		const dashboardNode = (peer) => {
			return managedNode(backend, {
				appEntries: apps.catalogue(backend.appsDir),
				location: settings.location(),
				weather: settings.weather(),
				shortcutList: shortcuts.shortcuts(DOMAINS.univrs),
				shareList: [...shares.folders(), ...shares.timeMachines(settings.WEATHER_CLOCK)],
				peer
			});
		};

		backend.setState(dashboardNode('adopted'));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await controlClock(page, settings.WEATHER_CLOCK);
		await open(page, backend.url, '/', '#peer .card');
		await page.waitForSelector('#resources-monitor .network-chart', { visible: true });
		await fillNetworkHistory(page, backend);
		await waitForImages(page, '#apps-shortcuts img');
		await capture.fullPage(page, 'dashboard');

		await capture.region(page, ['#resources-monitor'], 'dashboard-status', TIGHT_PADDING);

		await capture.region(page, [MENU_TOGGLE, `${VISIBLE_ACCOUNT} .account-toggle`], 'menu-toggle', MENU_PADDING);

		const windowToggles = [...DOCKED_APPS.map(windowToggle), WINDOW_TOGGLE];
		await serveWindowPage(page, await Promise.all(windowToggles.map((toggle) => { return page.$eval(toggle, (element) => { return element.dataset.url; }); })));
		for (const toggle of windowToggles) {
			await page.$eval(toggle, (element) => { element.click(); });
			await sleep(SETTLE_MS);
		}
		await page.waitForSelector(`${WINDOW_ENTRY}.active`, { visible: true });
		await page.click(MENU_TOGGLE);
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS * 2);
		await capture.viewport(page, 'dashboard-window');

		await page.click('header nav a[href="/dashboard"]');
		await sleep(SETTLE_MS);
		const menuItem = await page.$eval(MENU_ITEM, centerOf);
		await page.mouse.move(menuItem.x, menuItem.y);
		await page.waitForSelector('.tooltip.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.viewport(page, 'menu-collapsed');

		await page.click(MENU_TOGGLE);
		await page.click(`header .navbar .nav .windows > div:last-child ${WINDOW_ENTRY.split(' ').pop()}`);
		await page.click(`${WINDOW_ENTRY}.active .unmaximize-window`);
		await page.click(MENU_TOGGLE);
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.viewport(page, 'dashboard-window-floating');
		await page.click(MENU_TOGGLE);
		for (const toggle of windowToggles) {
			await page.hover(WINDOW_ENTRY);
			await page.click(`${WINDOW_ENTRY} .close-window`);
			await sleep(SETTLE_MS);
		}

		await page.click(`${REORDER_GROUP} .order`);
		await page.waitForSelector(`${REORDER_GROUP}.dragging`, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, [REORDER_GROUP], 'dashboard-reorder', TIGHT_PADDING);

		const from = await page.$eval(`${REORDER_GROUP} .card[data-type="shortcut"]`, centerOf);
		const to = await page.$eval(`${REORDER_GROUP} .col:first-child .card`, centerOf);
		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await page.mouse.move(to.x, to.y, { steps: 20 });
		await sleep(SETTLE_MS);
		await page.$eval(`${REORDER_GROUP} .card[data-type="shortcut"]`, showDragImage, to, DRAG_IMAGE_OFFSET);
		await capture.region(page, [REORDER_GROUP], 'dashboard-reorder-drag', TIGHT_PADDING);
		await page.$eval('.drag-image', (element) => { element.remove(); });
		await page.mouse.up();
		await sleep(SETTLE_MS);
		await page.click(`${REORDER_GROUP} .order`);
		await sleep(SETTLE_MS);

		await openMenu(page, '#peer .dropdown-toggle', '#peer .dropdown-menu.show');
		await capture.region(page, ['#peer .card', '#peer .dropdown-menu.show'], 'dashboard-nodes', TIGHT_PADDING);
		await closePage(page);

		backend.setState(dashboardNode('available'));
		const adopting = await signedInPage(browser, backend, viewport, users.owner());
		await open(adopting, backend.url, '/', '#peer [data-action="adopt"]');
		await capture.region(adopting, ['#peer .card'], 'dashboard-adopt', TIGHT_PADDING);
		await closePage(adopting);
	},
	ups: async ({ browser, backend, capture, viewport }) => {
		const page = await signedInPage(browser, backend, viewport, users.owner());
		backend.setState({ ...managedNode(backend), ups: upsCharging() });
		await open(page, backend.url, '/', UPS_BADGE);
		await capture.region(page, [UPS_ROW], 'ups-grid', TIGHT_PADDING);

		backend.setState({ ...managedNode(backend), ups: upsOnBattery() });
		await open(page, backend.url, '/', UPS_BADGE);
		await capture.region(page, [UPS_ROW], 'ups-battery', TIGHT_PADDING);

		backend.setState({ ...managedNode(backend), ups: upsMissing() });
		await open(page, backend.url, '/', UPS_BADGE);
		await capture.region(page, [UPS_ROW], 'ups-missing', TIGHT_PADDING);

		backend.setState({ ...managedNode(backend), ups: upsUnreachable() });
		await open(page, backend.url, '/', UPS_FAULT);
		await capture.region(page, [UPS_ROW], 'ups-unreachable', TIGHT_PADDING);

		backend.setState({ ...managedNode(backend), ups: upsFailed() });
		await open(page, backend.url, '/', UPS_FAULT);
		await capture.region(page, [UPS_ROW], 'ups-failed', TIGHT_PADDING);
		await closePage(page);
	},
	shortcuts: async ({ browser, backend, capture, viewport }) => {
		const list = shortcuts.shortcuts(DOMAINS.univrs);
		const proxied = list.find((shortcut) => { return shortcut.traefik; });
		backend.setState(shortcutsNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/shortcuts', SHORTCUTS_PAGE);
		await waitForImages(page, '#shortcuts tbody img');
		await capture.viewport(page, 'shortcuts');

		await openMenu(page, `${shortcutRow(proxied)} .dropdown-toggle`, '#shortcuts .dropdown-menu.show');
		await capture.region(page, ['#shortcuts .search', '#shortcuts table', '#shortcuts .dropdown-menu.show'], 'shortcuts-menu', PADDING);
		await closePage(page);

		const link = await openShortcutCreate(browser, backend, viewport);
		await setValue(link, '#shortcut-create .title', shortcuts.NEW_LINK.title);
		await setValue(link, '#shortcut-create .category', shortcuts.NEW_LINK.category);
		await setValue(link, '#shortcut-create .url', shortcuts.NEW_LINK.url);
		await link.$eval('#shortcut-create .shortcut-icon-img', (image, src) => { image.src = src; }, shortcuts.iconUrl(shortcuts.NEW_LINK.icon));
		await waitForImages(link, '#shortcut-create .shortcut-icon-img');
		await capture.region(link, ['#shortcut-create .modal-content'], 'shortcut-create', PADDING);
		await closePage(link);

		const proxy = await openShortcutCreate(browser, backend, viewport);
		await setValue(proxy, '#shortcut-create .title', shortcuts.NEW_PROXY.title);
		await setValue(proxy, '#shortcut-create .category', shortcuts.NEW_PROXY.category);
		await proxy.click('#shortcut-create .shortcut-icon-box');
		await proxy.waitForSelector(`${ICON_POPOVER} .icon-search`, { visible: true });
		await setValue(proxy, `${ICON_POPOVER} .icon-search`, shortcuts.ICON_SEARCH);
		await waitForImages(proxy, `${ICON_POPOVER} .shortcut-icon-results img`);
		await capture.region(proxy, ['#shortcut-create .modal-content', ICON_POPOVER], 'shortcut-icon', PADDING);
		await proxy.click(`${ICON_POPOVER} .shortcut-icon-result-item`);
		await proxy.waitForSelector(ICON_POPOVER, { hidden: true });
		await proxy.click('#shortcut-create .use-proxy >>> input');
		await proxy.waitForSelector('#shortcut-create .proxy-container:not(.d-none)', { visible: true });
		await setValue(proxy, '#shortcut-create .subdomain', shortcuts.NEW_PROXY.subdomain);
		await setValue(proxy, '#shortcut-create .backend-url', shortcuts.NEW_PROXY.backendUrl);
		await proxy.click('#shortcut-create .require-auth >>> input');
		await sleep(SETTLE_MS);
		await waitForImages(proxy, '#shortcut-create .shortcut-icon-img');
		await capture.region(proxy, ['#shortcut-create .modal-content'], 'shortcut-create-proxy', PADDING);
		await closePage(proxy);

		const dashboard = await signedInPage(browser, backend, viewport, users.owner());
		await open(dashboard, backend.url, '/', '#apps-shortcuts .card');
		await waitForImages(dashboard, '#apps-shortcuts img');
		await capture.region(dashboard, ['#apps-shortcuts'], 'shortcuts-dashboard', { ...DASHBOARD_GROUP_PADDING, bottom: 0 });
		await closePage(dashboard);
	},
	folders: async ({ browser, backend, capture, viewport }) => {
		const folders = shares.folders();
		const [documents] = folders;
		const guest = folders.find((folder) => { return !folder.isPrivate; });
		backend.setState(foldersNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/folders', FOLDERS_PAGE);
		await capture.viewport(page, 'folders');

		await hoverTooltip(page, `${folderRow(guest)} [data-action="copy-to-clipboard"]`);
		await capture.region(page, ['#folders .search', '#folders table', '.tooltip.show'], 'folders-address', PADDING);
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);

		await openMenu(page, `${folderRow(documents)} .dropdown-toggle`, '#folders .dropdown-menu.show');
		await capture.region(page, ['#folders .search', '#folders table', '#folders .dropdown-menu.show'], 'folders-menu', PADDING);

		await openModal(page, `${folderRow(documents)} a[href="#folder-update"]`, '#folder-update');
		await capture.region(page, ['#folder-update .modal-content'], 'folder-edit', PADDING);
		await closePage(page);

		for (const [folder, name] of [[shares.NEW_FOLDER, 'folder-create'], [shares.EXISTING_PATH_FOLDER, 'folder-create-existing']]) {
			const creating = await signedInPage(browser, backend, viewport, users.owner());
			await open(creating, backend.url, '/folders', FOLDERS_PAGE);
			await openModal(creating, '#folders a[href="#folder-create"]', '#folder-create');
			await creating.waitForSelector(FOLDER_CREATE_READY, { visible: true });
			await fillFolder(creating, folder);
			await capture.region(creating, ['#folder-create .modal-content'], name, PADDING);
			await closePage(creating);
		}

		const dashboard = await signedInPage(browser, backend, viewport, users.owner());
		await open(dashboard, backend.url, '/', '#shares .folders .card');
		await capture.region(dashboard, ['#shares .folders'], 'folders-dashboard', { ...DASHBOARD_GROUP_PADDING, bottom: 0 });
		await closePage(dashboard);
	},
	'time-machines': async ({ browser, backend, capture, viewport }) => {
		const timeMachines = shares.timeMachines(settings.WEATHER_CLOCK);
		const [first, second] = timeMachines;
		backend.setState(managedNode(backend, { shareList: timeMachines }));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await controlClock(page, settings.WEATHER_CLOCK);
		await open(page, backend.url, '/time-machines', TIME_MACHINES_PAGE);
		await capture.viewport(page, 'time-machines');

		await hoverTooltip(page, `${timeMachineRow(first)} [data-action="copy-to-clipboard"]`);
		await capture.region(page, ['#time-machines .search', '#time-machines table', '.tooltip.show'], 'time-machines-address', PADDING);

		await hoverTooltip(page, `${timeMachineRow(first)} td:nth-child(4) small`);
		await capture.region(page, ['#time-machines .search', '#time-machines table', '.tooltip.show'], 'time-machines-backups', PADDING);
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);

		await openMenu(page, `${timeMachineRow(second)} .dropdown-toggle`, '#time-machines .dropdown-menu.show');
		await capture.region(page, ['#time-machines .search', '#time-machines table', '#time-machines .dropdown-menu.show'], 'time-machines-menu', PADDING);

		await openModal(page, `${timeMachineRow(second)} a[href="#time-machine-update"]`, '#time-machine-update');
		await capture.region(page, ['#time-machine-update .modal-content'], 'time-machine-edit', PADDING);
		await closePage(page);

		const creating = await signedInPage(browser, backend, viewport, users.owner());
		await open(creating, backend.url, '/time-machines', TIME_MACHINES_PAGE);
		await openModal(creating, '#time-machines a[href="#time-machine-create"]', '#time-machine-create');
		await setValue(creating, '#time-machine-create .comment', shares.NEW_TIME_MACHINE.comment);
		await setValue(creating, '#time-machine-create .valid-users', shares.NEW_TIME_MACHINE.user);
		await setValue(creating, '#time-machine-create .refquota', shares.NEW_TIME_MACHINE.capacity);
		await capture.region(creating, ['#time-machine-create .modal-content'], 'time-machine-create', PADDING);
		await closePage(creating);

		const dashboard = await signedInPage(browser, backend, viewport, users.owner());
		await open(dashboard, backend.url, '/', '#shares .time-machines .card');
		await capture.region(dashboard, ['#shares .time-machines'], 'time-machines-dashboard', DASHBOARD_GROUP_PADDING);
		await closePage(dashboard);
	},
	users: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/users', '#users .container-fluid:not(.d-none)');
		await capture.viewport(page, 'users');

		const regular = users.regularUser();
		await openMenu(page, `#users tr[data-uid="${regular.uid}"] .dropdown-toggle`, '#users .dropdown-menu.show');
		await capture.region(page, ['#users .search', '#users table', '#users .dropdown-menu.show'], 'users-menu', PADDING);
		await page.keyboard.press('Escape');

		await openModal(page, '#users a[href="#user-create"]', '#user-create');
		await setValue(page, '#user-create .fullname', users.NEW_USER.fullname);
		await setValue(page, '#user-create .email', users.NEW_USER.email);
		await setValue(page, '#user-create .username', users.NEW_USER.username);
		await setValue(page, '#user-create .password', users.NEW_USER.password);
		await setValue(page, '#user-create .password-check', users.NEW_USER.password);
		await capture.region(page, ['#user-create .modal-content'], 'user-create', PADDING);
		await closePage(page);
	},
	profile: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/users/profile', '#profile .container-fluid:not(.d-none)');
		await capture.viewport(page, 'profile');

		await openModal(page, '#profile a[href="#profile-edit"]', '#profile-edit');
		await capture.region(page, ['#profile-edit .modal-content'], 'profile-edit', PADDING);
		await closeModal(page, '#profile-edit');

		await openModal(page, '#profile a[href="#profile-password"]', '#profile-password');
		await setValue(page, '#profile-password .password', users.NEW_PASSWORD);
		await setValue(page, '#profile-password .password-check', users.NEW_PASSWORD);
		await capture.region(page, ['#profile-password .modal-content'], 'profile-password', PADDING);
		await closeModal(page, '#profile-password');
		await closePage(page);

		const regular = await signedInPage(browser, backend, viewport, users.regularUser());
		await open(regular, backend.url, '/users/profile', '#profile .container-fluid:not(.d-none)');
		await capture.viewport(regular, 'profile-user');
		await closePage(regular);
	},
	settings: async ({ browser, backend, capture, viewport }) => {
		const smtp = settings.smtp();
		const location = settings.location();
		backend.setState(managedNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/settings', SETTINGS_PAGE);
		await capture.fullPage(page, 'settings-empty');

		await openModal(page, '#settings a[href="#smtp"]', '#smtp');
		await setValue(page, '#smtp .address', smtp.address);
		await setValue(page, '#smtp .port', smtp.port);
		await setValue(page, '#smtp .username', smtp.username);
		await setValue(page, '#smtp .password', smtp.password);
		await setValue(page, '#smtp .sender', smtp.sender);
		await page.$eval('#smtp .recipients', (element, recipients) => { element.tags = recipients; }, smtp.recipients);
		await sleep(SETTLE_MS);
		await capture.region(page, ['#smtp .modal-content'], 'settings-notifications', PADDING);
		await closeModal(page, '#smtp');

		await openModal(page, '#settings a[href="#location"]', '#location');
		await setValue(page, '#location .latitude', location.latitude);
		await setValue(page, '#location .longitude', location.longitude);
		await capture.region(page, ['#location .modal-content'], 'settings-location', PADDING);
		await closeModal(page, '#location');

		await openModal(page, '#settings a[href="#fleet"]', '#fleet');
		await capture.region(page, ['#fleet .modal-content'], 'settings-fleet', PADDING);
		await closeModal(page, '#fleet');

		await page.click('#settings [data-action="reboot"]');
		await page.waitForSelector('.modal.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(page, ['.modal.show .modal-content'], 'settings-reboot', PADDING);
		await closePage(page);

		backend.setState(managedNode(backend, { smtp, location }));
		const configured = await signedInPage(browser, backend, viewport, users.owner());
		await open(configured, backend.url, '/settings', SETTINGS_PAGE);
		await capture.fullPage(configured, 'settings-configured');
		await closePage(configured);

		backend.setState(managedNode(backend, { domain: 'custom', smtp, location }));
		const custom = await signedInPage(browser, backend, viewport, users.owner());
		await open(custom, backend.url, '/settings', SETTINGS_PAGE);
		await capture.region(custom, [FLEET_CARD], 'settings-fleet-custom', CARD_PADDING);
		await closePage(custom);

		backend.setState(managedNode(backend, { smtp, location, weather: settings.weather() }));
		const dashboard = await signedInPage(browser, backend, viewport, users.owner());
		await controlClock(dashboard, settings.WEATHER_CLOCK);
		await open(dashboard, backend.url, '/', '#weather .card');
		await capture.region(dashboard, ['#weather .card'], 'weather', PADDING);
		await dashboard.click('#weather .card');
		await dashboard.waitForSelector('.weather-forecast-popover', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(dashboard, ['#weather .card', '.weather-forecast-popover'], 'weather-forecast', PADDING);
		await closePage(dashboard);
	},
	network: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/network', NETWORK_PAGE);
		await capture.fullPage(page, 'network');

		await openModal(page, '#network a[href="#network-identifier"]', '#network-identifier');
		await capture.region(page, ['#network-identifier .modal-content'], 'network-host', PADDING);
		await closeModal(page, '#network-identifier');

		await openModal(page, '#network a[href="#network-interface"]', '#network-interface');
		await capture.region(page, ['#network-interface .modal-content'], 'network-interface', PADDING);
		await closeModal(page, '#network-interface');

		await openModal(page, '#network a[href="#trusted-proxy-add"]', '#trusted-proxy-add');
		await setValue(page, '#trusted-proxy-add .address', TRUSTED_PROXY);
		await capture.region(page, ['#trusted-proxy-add .modal-content'], 'network-proxy-add', PADDING);
		await closePage(page);

		backend.setState(managedNode(backend, { trustedProxies: [TRUSTED_PROXY] }));
		const proxies = await signedInPage(browser, backend, viewport, users.owner());
		await open(proxies, backend.url, '/network', NETWORK_PAGE);
		await openMenu(proxies, `#network .item[data-id="${TRUSTED_PROXY}"] .dropdown-toggle`, '#network .dropdown-menu.show');
		await capture.region(proxies, [networkCard(3), '#network .dropdown-menu.show'], 'network-proxies', CARD_PADDING);
		await closePage(proxies);

		backend.setState(managedNode(backend, { isStandby: true }));
		const standby = await signedInPage(browser, backend, viewport, users.owner());
		await open(standby, backend.url, '/network', NETWORK_PAGE);
		await capture.region(standby, [networkCard(2)], 'network-standby', CARD_PADDING);
		await openModal(standby, '#network a[href="#network-interface"]', '#network-interface');
		await standby.hover('#network-interface .virtual-ip >>> .help-inline');
		await standby.waitForSelector('.tooltip.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(standby, ['#network-interface .modal-content', '.tooltip.show'], 'network-interface-standby', PADDING);
		await closePage(standby);
	},
	storage: async ({ browser, backend, capture, viewport }) => {
		backend.setState(storageNode(backend));
		const page = await storagePage(browser, backend, viewport);
		await open(page, backend.url, '/storage', STORAGE_PAGE);
		await capture.viewport(page, 'storage');

		await open(page, backend.url, '/storage/messier', STORAGE_POOL);
		await page.click('#storage .details .details-toggle');
		await page.waitForSelector(VDEV_DETAILS, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.fullPage(page, 'storage-pool');
		await closePage(page);

		backend.setState(storageNode(backend, { scrub: 'running' }));
		const scrubbing = await storagePage(browser, backend, viewport);
		await open(scrubbing, backend.url, '/storage/messier', STORAGE_POOL);
		await capture.region(scrubbing, [poolCard(1)], 'storage-scrub', POOL_CARD_PADDING);
		await closePage(scrubbing);

		backend.setState(storageNode(backend, { missingDrive: 'nvme0n1' }));
		const degraded = await storagePage(browser, backend, viewport);
		await open(degraded, backend.url, '/storage', STORAGE_PAGE);
		await capture.region(degraded, ['#storage .search', '#storage table'], 'storage-degraded', CARD_PADDING);
		await open(degraded, backend.url, '/storage/messier', STORAGE_POOL);
		await degraded.click('#storage .details .details-toggle');
		await degraded.waitForSelector(VDEV_DETAILS, { visible: true });
		await degraded.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(degraded, [poolCard(3)], 'storage-degraded-topology', POOL_CARD_PADDING);
		await closePage(degraded);

		backend.setState(storageNode(backend, { replacedDrive: 'nvme0n1', scrub: 'resilver' }));
		const resilvering = await storagePage(browser, backend, viewport);
		await open(resilvering, backend.url, '/storage/messier', STORAGE_POOL);
		await capture.region(resilvering, [poolCard(1)], 'storage-resilver', POOL_CARD_PADDING);
		await resilvering.click('#storage .details .details-toggle');
		await resilvering.waitForSelector(VDEV_DETAILS, { visible: true });
		await resilvering.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(resilvering, [poolCard(3)], 'storage-resilver-topology', POOL_CARD_PADDING);
		await closePage(resilvering);
	},
	services: async ({ browser, backend, capture, viewport }) => {
		backend.setState({ ...managedNode(backend), services: serviceData.services(), serviceLogs: { [serviceData.LOG_UNIT]: serviceData.LOGS } });
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/system-services', SERVICES_PAGE);
		await capture.viewport(page, 'services');

		await page.click('#system-services .filter-type [data-filter-type="service"]');
		await sleep(SETTLE_MS);
		await openMenu(page, `${SERVICES_FILTER} [data-bs-toggle="dropdown"]`, '#system-services .filter-menu.show');
		await page.click('#system-services-filter-sub-running');
		await sleep(SETTLE_MS);
		await capture.region(page, ['#system-services .search', '#system-services .filter-type', '#system-services .filter-pills', '#system-services .filter-menu.show'], 'services-filter', PADDING);
		await page.keyboard.press('Escape');
		await sleep(SETTLE_MS);
		await capture.viewport(page, 'services-filtered');
		await page.click('#system-services [data-action="clear-filters"]');
		await page.click('#system-services .filter-type [data-filter-type=""]');
		await sleep(SETTLE_MS);

		const failedRow = '#system-services tbody tr[data-unit="systemd-networkd-wait-online.service"]';
		const maskedRow = '#system-services tbody tr[data-unit="systemd-networkd.service"]';
		await searchServices(page, 'systemd-networkd');
		await page.waitForSelector(failedRow, { visible: true });
		await page.waitForSelector(maskedRow, { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(page, ['#system-services .search', '#system-services .filter-type', '#system-services thead', failedRow, maskedRow], 'services-problems', PADDING);
		await searchServices(page, '');

		const unitRow = `#system-services tbody tr[data-unit="${serviceData.LOG_UNIT}"]`;
		await openMenu(page, `${unitRow} .dropdown-toggle`, '#system-services tbody .dropdown-menu.show');
		await capture.region(page, [unitRow, '#system-services tbody .dropdown-menu.show'], 'services-menu', PADDING);
		await page.keyboard.press('Escape');
		await sleep(SETTLE_MS);

		await open(page, backend.url, `/system-services/${serviceData.LOG_UNIT}`, '#system-services .details .item');
		await capture.viewport(page, 'services-details');
		await page.click('#system-services .details a.logs');
		await page.waitForSelector('#system-services .details .logs-container:not(.d-none) li', { visible: true });
		await page.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.viewport(page, 'services-logs');
		await closePage(page);
	},
	about: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend, { apiVersion: backend.apiVersion }));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/about', '#about .container-fluid:not(.d-none)');
		await capture.viewport(page, 'about');
		await closePage(page);
	},
	updates: async ({ browser, backend, capture, viewport }) => {
		const page = await signedInPage(browser, backend, viewport, users.owner());
		backend.setState({ ...managedNode(backend), updates: [] });
		await open(page, backend.url, '/system-updates', UPDATES_PAGE);
		await capture.viewport(page, 'updates-none');

		backend.setState({ ...managedNode(backend), updates: [], checkUpdates: true });
		await open(page, backend.url, '/system-updates', UPDATES_PAGE);
		await capture.region(page, ['#system-updates .card'], 'updates-checking', CARD_PADDING);

		backend.setState({ ...managedNode(backend), updates: updates.available() });
		await open(page, backend.url, '/system-updates', UPDATES_PAGE);
		await capture.viewport(page, 'updates-available');

		await open(page, backend.url, '/', 'header a[href="/system-updates"] u-badge');
		await capture.region(page, ['header a[href="/settings"]', 'header a[href="/about"]'], 'updates-menu', MENU_PADDING);

		backend.setState({ ...managedNode(backend), updates: updates.available(), update: updates.running() });
		await open(page, backend.url, '/', '#update .steps');
		await capture.viewport(page, 'update-progress');

		backend.setState({ ...managedNode(backend), updates: [], update: updates.finished() });
		await open(page, backend.url, '/', '#update [data-action="complete"]');
		await capture.viewport(page, 'update-finished');

		backend.setState({ ...managedNode(backend), updates: updates.available(), update: updates.failed() });
		await open(page, backend.url, '/', '#update [data-action="complete"]');
		await capture.viewport(page, 'update-failed');
		await closePage(page);

		backend.setState({ ...managedNode(backend), updates: updates.available(), update: updates.running() });
		const regular = await signedInPage(browser, backend, viewport, users.regularUser());
		await open(regular, backend.url, '/', '#maintenance');
		await capture.viewport(regular, 'update-maintenance');
		await closePage(regular);
	}
};

export default {
	name: 'management',
	pages
};
