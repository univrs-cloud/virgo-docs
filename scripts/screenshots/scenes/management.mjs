import { SETTLE_MS, sleep, newPage, closePage, controlClock, advanceClock, open, setValue, blur, openMenu, openModal, closeModal } from '../capture.mjs';
import * as apps from '../data/apps.mjs';
import { DOMAINS } from '../data/network.mjs';
import { nodeState } from '../data/node.mjs';
import { networkHistory } from '../data/status.mjs';
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

const STORAGE_PAGE = '#storage .container-fluid:not(.d-none)';
const STORAGE_POOL = '#storage .details .item';
const poolCard = (index) => { return `#storage .details .overflow-y-scroll > .card:nth-child(${index})`; };
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
const REORDER_GROUP = '#apps-shortcuts .group:nth-child(2)';

const DRAG_IMAGE_OFFSET = { x: 90, y: 34 };

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
	await blur(page);
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
	dashboard: async ({ browser, backend, capture, viewport }) => {
		const dashboardNode = (peer) => {
			return managedNode(backend, {
				appEntries: apps.catalogue(backend.appsDir),
				location: settings.location(),
				weather: settings.weather(),
				shortcutList: shortcuts.shortcuts(DOMAINS.univrs),
				shareList: [...shares.folders(), ...shares.timeMachines(settings.WEATHER_CLOCK)],
				peer,
				indexedAt: settings.WEATHER_CLOCK
			});
		};

		backend.setState(dashboardNode('adopted'));
		const page = await signedInPage(browser, backend, viewport, users.owner());
		await controlClock(page, settings.WEATHER_CLOCK);
		await open(page, backend.url, '/', '#peer .card');
		await page.waitForSelector('#resources-monitor .network-chart', { visible: true });
		await page.waitForSelector('#resources-monitor .indexer-stats h6', { visible: true });
		await fillNetworkHistory(page, backend);
		await waitForImages(page, '#apps-shortcuts img');
		await capture.fullPage(page, 'dashboard');

		await capture.region(page, ['#resources-monitor'], 'dashboard-status', TIGHT_PADDING);

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
		await blur(link);
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
		await blur(proxy);
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
		await blur(page);
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
		await blur(page);
		await capture.region(page, ['#time-machine-update .modal-content'], 'time-machine-edit', PADDING);
		await closePage(page);

		const creating = await signedInPage(browser, backend, viewport, users.owner());
		await open(creating, backend.url, '/time-machines', TIME_MACHINES_PAGE);
		await openModal(creating, '#time-machines a[href="#time-machine-create"]', '#time-machine-create');
		await setValue(creating, '#time-machine-create .comment', shares.NEW_TIME_MACHINE.comment);
		await setValue(creating, '#time-machine-create .valid-users', shares.NEW_TIME_MACHINE.user);
		await setValue(creating, '#time-machine-create .refquota', shares.NEW_TIME_MACHINE.capacity);
		await blur(creating);
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
	storage: async ({ browser, backend, capture, viewport }) => {
		backend.setState(storageNode(backend));
		const page = await storagePage(browser, backend, viewport);
		await open(page, backend.url, '/storage', STORAGE_PAGE);
		await capture.viewport(page, 'storage');

		await open(page, backend.url, '/storage/messier', STORAGE_POOL);
		await page.click('#storage .details .details-toggle');
		await page.waitForSelector('#storage .details .vdev-rows.show', { visible: true });
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
		await degraded.waitForSelector('#storage .details .vdev-rows.show', { visible: true });
		await degraded.mouse.move(0, 0);
		await sleep(SETTLE_MS);
		await capture.region(degraded, [poolCard(3)], 'storage-degraded-topology', POOL_CARD_PADDING);
		await closePage(degraded);

		backend.setState(storageNode(backend, { replacedDrive: 'nvme0n1', scrub: 'resilver' }));
		const resilvering = await storagePage(browser, backend, viewport);
		await open(resilvering, backend.url, '/storage/messier', STORAGE_POOL);
		await capture.region(resilvering, [poolCard(1)], 'storage-resilver', POOL_CARD_PADDING);
		await resilvering.click('#storage .details .details-toggle');
		await resilvering.waitForSelector('#storage .details .vdev-rows.show', { visible: true });
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
