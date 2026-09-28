import { SETTLE_MS, sleep, newPage, closePage, controlClock, advanceClock, open, setValue, blur, openMenu, openModal, closeModal } from '../capture.mjs';
import * as apps from '../data/apps.mjs';
import { nodeState } from '../data/node.mjs';
import { networkHistory } from '../data/status.mjs';
import * as users from '../data/users.mjs';

const PADDING = 32;
const ACCOUNT_MENU_PADDING = { top: 12, right: PADDING, bottom: 8, left: PADDING };
const DASHBOARD_HEIGHT = 960;
const IN_USE_POOL_PERCENT = 34;
const VISIBLE_ACCOUNT = 'header .account:not(.d-sm-none)';

const managedNode = (backend) => {
	return nodeState(backend.getTopologies, {
		setupCompleted: true,
		poolUsedPercent: IN_USE_POOL_PERCENT,
		isRegistered: true,
		certificateIssued: true,
		runningApps: apps.CORE_APP_NAMES,
		userList: users.USERS,
		withStatus: true
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
	}
};

export default {
	name: 'management',
	pages
};
