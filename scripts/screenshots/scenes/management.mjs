import { SETTLE_MS, sleep, newPage, closePage, controlClock, advanceClock, open, setValue, blur, openMenu, openModal, closeModal } from '../capture.mjs';
import * as apps from '../data/apps.mjs';
import { nodeState } from '../data/node.mjs';
import { networkHistory } from '../data/status.mjs';
import * as serviceData from '../data/services.mjs';
import * as settings from '../data/settings.mjs';
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
const FLEET_CARD = '#settings .row > .col-12:nth-child(3) .card';

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

const UPDATES_PAGE = '#system-updates .container-fluid:not(.d-none)';
const CHECKING_PADDING = { top: 48, right: 160, bottom: 48, left: 160 };
const MENU_PADDING = { top: 4, right: 16, bottom: 8, left: 16 };

const pages = {
	authentication: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend));
		const page = await newPage(browser, { ...viewport, height: DASHBOARD_HEIGHT });
		await open(page, backend.url, '/login', 'main .username');
		await setValue(page, 'main .username', users.owner().username);
		await setValue(page, 'main .password', users.OWNER_PASSWORD);
		await blur(page);
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
		await blur(page);
		await capture.region(page, ['#user-create .modal-content'], 'user-create', PADDING);
		await closePage(page);
	},
	profile: async ({ browser, backend, capture, viewport }) => {
		backend.setState(managedNode(backend));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/users/profile', '#profile .container-fluid:not(.d-none)');
		await capture.viewport(page, 'profile');

		await openMenu(page, '#profile .dropdown-toggle', '#profile .dropdown-menu.show');
		await capture.region(page, ['#profile .card', '#profile .dropdown-menu.show'], 'profile-menu', PADDING);

		await openModal(page, '#profile a[href="#profile-edit"]', '#profile-edit');
		await blur(page);
		await capture.region(page, ['#profile-edit .modal-content'], 'profile-edit', PADDING);
		await closeModal(page, '#profile-edit');

		await openMenu(page, '#profile .dropdown-toggle', '#profile .dropdown-menu.show');
		await openModal(page, '#profile a[href="#profile-password"]', '#profile-password');
		await setValue(page, '#profile-password .password', users.NEW_PASSWORD);
		await setValue(page, '#profile-password .password-check', users.NEW_PASSWORD);
		await blur(page);
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
		await blur(page);
		await capture.region(page, ['#smtp .modal-content'], 'settings-notifications', PADDING);
		await closeModal(page, '#smtp');

		await openModal(page, '#settings a[href="#location"]', '#location');
		await setValue(page, '#location .latitude', location.latitude);
		await setValue(page, '#location .longitude', location.longitude);
		await blur(page);
		await capture.region(page, ['#location .modal-content'], 'settings-location', PADDING);
		await closeModal(page, '#location');

		await openModal(page, '#settings a[href="#fleet"]', '#fleet');
		await blur(page);
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
		await blur(page);
		await capture.region(page, ['#network-identifier .modal-content'], 'network-host', PADDING);
		await closeModal(page, '#network-identifier');

		await openModal(page, '#network a[href="#network-interface"]', '#network-interface');
		await blur(page);
		await capture.region(page, ['#network-interface .modal-content'], 'network-interface', PADDING);
		await closeModal(page, '#network-interface');

		await openModal(page, '#network a[href="#trusted-proxy-add"]', '#trusted-proxy-add');
		await setValue(page, '#trusted-proxy-add .address', TRUSTED_PROXY);
		await blur(page);
		await capture.region(page, ['#trusted-proxy-add .modal-content'], 'network-proxy-add', PADDING);
		await closePage(page);

		backend.setState(managedNode(backend, { trustedProxies: [TRUSTED_PROXY] }));
		const proxies = await signedInPage(browser, backend, viewport, users.owner());
		await open(proxies, backend.url, '/network', NETWORK_PAGE);
		await openMenu(proxies, `#network tr[data-id="${TRUSTED_PROXY}"] .dropdown-toggle`, '#network .dropdown-menu.show');
		await capture.region(proxies, [networkCard(3), '#network .dropdown-menu.show'], 'network-proxies', CARD_PADDING);
		await closePage(proxies);

		backend.setState(managedNode(backend, { isStandby: true }));
		const standby = await signedInPage(browser, backend, viewport, users.owner());
		await open(standby, backend.url, '/network', NETWORK_PAGE);
		await capture.region(standby, [networkCard(2)], 'network-standby', CARD_PADDING);
		await openModal(standby, '#network a[href="#network-interface"]', '#network-interface');
		await blur(standby);
		await standby.hover('#network-interface .virtual-ip >>> .help-inline');
		await standby.waitForSelector('.tooltip.show', { visible: true });
		await sleep(SETTLE_MS);
		await capture.region(standby, ['#network-interface .modal-content', '.tooltip.show'], 'network-interface-standby', PADDING);
		await closePage(standby);
	},
	services: async ({ browser, backend, capture, viewport }) => {
		backend.setState({ ...managedNode(backend), services: serviceData.services(), serviceLogs: { [serviceData.LOG_UNIT]: serviceData.LOGS } });
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await open(page, backend.url, '/system-services', SERVICES_PAGE);
		await capture.viewport(page, 'services');

		await page.click('#system-services .filter-type [data-filter-type="service"]');
		await sleep(SETTLE_MS);
		await openMenu(page, `${SERVICES_FILTER} u-button`, '#system-services .filter-menu.show');
		await page.click('#system-services-filter-sub-running');
		await sleep(SETTLE_MS);
		await capture.region(page, ['#system-services .search', '#system-services .filter-type', '#system-services .filter-pills', '#system-services .filter-menu.show'], 'services-filter', PADDING);
		await page.keyboard.press('Escape');
		await blur(page);
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
		await blur(page);
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
	updates: async ({ browser, backend, capture, viewport }) => {
		const page = await signedInPage(browser, backend, viewport, users.owner());
		backend.setState({ ...managedNode(backend), updates: [] });
		await open(page, backend.url, '/system-updates', UPDATES_PAGE);
		await capture.viewport(page, 'updates-none');

		backend.setState({ ...managedNode(backend), updates: [], checkUpdates: true });
		await open(page, backend.url, '/system-updates', UPDATES_PAGE);
		await capture.region(page, ['#system-updates .no-content .icon-face-party', '#system-updates .no-content .check-updates'], 'updates-checking', CHECKING_PADDING);

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
