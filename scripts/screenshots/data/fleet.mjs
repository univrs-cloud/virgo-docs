const EMAIL = 'univrs@gmail.com';
const PASSWORD = 'q7Rt2Vx9Lm4Kp8Zw';

const unregistered = () => {
	return { fleet: {} };
};

const registered = () => {
	return { fleet: { email: EMAIL, token: 'example-token', enabled: true, connected: true } };
};

export {
	EMAIL,
	PASSWORD,
	unregistered,
	registered
};
