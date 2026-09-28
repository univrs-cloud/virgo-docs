const OWNER_PASSWORD = 'n3Fh8Qs1Wd6Yb2Jc';
const NEW_PASSWORD = 'p4Xs9Dm2Gh7Kc3Rw';

const FACTORY_OWNER = { uid: 1000, username: 'voyager' };

const USERS = [
	{ uid: 1000, username: 'voyager', fullname: 'Administrator', email: 'voyager@univrs.cloud', shell: '/bin/bash', isOwner: true, isDisabled: false, groups: [{ groupname: 'voyager' }, 'admins'] },
	{ uid: 1001, username: 'olivia', fullname: 'Olivia Bennett', email: 'olivia@example.com', shell: '/usr/sbin/nologin', isOwner: false, isDisabled: false, groups: [{ groupname: 'olivia' }, 'admins'] },
	{ uid: 1002, username: 'james', fullname: 'James Carter', email: 'james@example.com', shell: '/usr/sbin/nologin', isOwner: false, isDisabled: false, groups: [{ groupname: 'james' }, 'users'] },
	{ uid: 1003, username: 'lucas', fullname: 'Lucas Meyer', email: 'lucas@example.com', shell: '/usr/sbin/nologin', isOwner: false, isDisabled: true, groups: [{ groupname: 'lucas' }, 'users'] }
];

const NEW_USER = { fullname: 'Emma Collins', email: 'emma@example.com', username: 'emma', password: 'k8Wq3Zr6Tn1Vb5Ly' };

const owner = () => {
	return USERS.find((user) => { return user.isOwner; });
};

const regularUser = () => {
	return USERS.find((user) => { return !user.isOwner && !user.isDisabled && user.groups.includes('users'); });
};

const accountCookie = (url, user) => {
	const groups = user.groups.filter((group) => { return typeof group === 'string'; });
	const account = { name: user.fullname, user: user.username, email: user.email, groups };
	return { name: 'account', value: Buffer.from(JSON.stringify(account)).toString('base64'), url };
};

export {
	OWNER_PASSWORD,
	NEW_PASSWORD,
	FACTORY_OWNER,
	USERS,
	NEW_USER,
	owner,
	regularUser,
	accountCookie
};
