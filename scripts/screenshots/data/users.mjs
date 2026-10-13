const OWNER_PASSWORD = 'n3Fh8Qs1Wd6Yb2Jc';
const NEW_PASSWORD = 'p4Xs9Dm2Gh7Kc3Rw';

const FACTORY_OWNER = { uid: 1000, username: 'voyager' };

const USERS = [
	{ uid: 1000, username: 'voyager', fullname: 'Administrator', email: 'voyager@univrs.cloud', shell: '/bin/bash', isOwner: true, isDisabled: false, groups: [{ groupname: 'voyager' }, 'admins'] },
	{ uid: 1001, username: 'olivia', fullname: 'Olivia Bennett', email: 'olivia@example.com', shell: '/usr/sbin/nologin', isOwner: false, isDisabled: false, groups: [{ groupname: 'olivia' }, 'admins'] },
	{ uid: 1002, username: 'james', fullname: 'James Carter', email: 'james@example.com', shell: '/usr/sbin/nologin', isOwner: false, isDisabled: false, groups: [{ groupname: 'james' }, 'users'] },
	{ uid: 1003, username: 'lucas', fullname: 'Lucas Meyer', email: 'lucas@example.com', shell: '/usr/sbin/nologin', isOwner: false, isDisabled: true, groups: [{ groupname: 'lucas' }, 'users'] }
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const MAC_FIREFOX = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:157.0) Gecko/20100101 Firefox/157.0';
const WINDOWS_EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1';
const LINUX_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0';

const SESSIONS = [
	{ id: 1, username: 'voyager', ipAddress: '192.168.1.42', userAgent: MAC_FIREFOX, signedInAgo: 2 * HOUR_MS, lastSeenAgo: null, isViewer: true },
	{ id: 2, username: 'voyager', ipAddress: '203.0.113.24', userAgent: ANDROID_CHROME, signedInAgo: 3 * DAY_MS, lastSeenAgo: null, isViewer: false },
	{ id: 3, username: 'voyager', ipAddress: '192.168.1.57', userAgent: WINDOWS_EDGE, signedInAgo: 6 * DAY_MS, lastSeenAgo: 2 * DAY_MS, isViewer: false },
	{ id: 4, username: 'olivia', ipAddress: '192.168.1.48', userAgent: WINDOWS_EDGE, signedInAgo: 5 * HOUR_MS, lastSeenAgo: null, isViewer: false },
	{ id: 5, username: 'olivia', ipAddress: '198.51.100.61', userAgent: IPHONE_SAFARI, signedInAgo: 4 * DAY_MS, lastSeenAgo: 20 * HOUR_MS, isViewer: false },
	{ id: 6, username: 'olivia', ipAddress: '192.168.1.48', userAgent: MAC_FIREFOX, signedInAgo: 6 * DAY_MS, lastSeenAgo: 5 * DAY_MS, isViewer: false },
	{ id: 7, username: 'james', ipAddress: '192.168.1.63', userAgent: LINUX_FIREFOX, signedInAgo: 40 * MINUTE_MS, lastSeenAgo: null, isViewer: true },
	{ id: 8, username: 'james', ipAddress: '203.0.113.90', userAgent: ANDROID_CHROME, signedInAgo: 5 * DAY_MS, lastSeenAgo: 3 * DAY_MS, isViewer: false }
];

const sessions = () => {
	const now = Date.now();
	return SESSIONS.map(({ signedInAgo, lastSeenAgo, ...session }) => {
		return {
			...session,
			createdAt: new Date(now - signedInAgo).toISOString(),
			lastSeenAt: new Date(now - (lastSeenAgo ?? 0)).toISOString(),
			isConnected: lastSeenAgo === null
		};
	});
};

const NEW_USER = { fullname: 'Emma Collins', email: 'emma@example.com', username: 'emma', password: 'k8Wq3Zr6Tn1Vb5Ly' };

const owner = () => {
	return USERS.find((user) => { return user.isOwner; });
};

const otherAdministrator = () => {
	return USERS.find((user) => { return !user.isOwner && user.groups.includes('admins'); });
};

const regularUser = () => {
	return USERS.find((user) => { return !user.isOwner && !user.isDisabled && user.groups.includes('users'); });
};

const accountCookie = (url, user) => {
	const groups = user.groups.filter((group) => { return typeof group === 'string'; });
	const account = { name: user.fullname, user: user.username, email: user.email, groups };
	const label = new URL(url).hostname.toLowerCase().split('.')[0];
	return { name: `account_${label}`, value: Buffer.from(JSON.stringify(account)).toString('base64'), url };
};

export {
	OWNER_PASSWORD,
	NEW_PASSWORD,
	FACTORY_OWNER,
	USERS,
	NEW_USER,
	owner,
	otherAdministrator,
	regularUser,
	sessions,
	accountCookie
};
