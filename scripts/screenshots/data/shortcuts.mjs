const ICON_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';

const SHORTCUTS = [
	{ title: 'Office printer', category: 'Productivity', icon: 'hp.svg', url: 'http://192.168.1.30' },
	{ title: 'UniFi Network', category: 'Networking', icon: 'unifi.svg', traefik: { subdomain: 'unifi', backendUrl: 'https://192.168.1.2:8443', isAuthRequired: true } },
	{ title: 'Cameras', category: 'Networking', icon: 'frigate.svg', traefik: { subdomain: 'cameras', backendUrl: 'http://192.168.1.40:5000', isAuthRequired: true } },
	{ title: 'Status page', category: 'System', icon: 'uptime-kuma.svg', url: 'https://status.example.com' }
];

const NEW_LINK = { title: 'Grafana', category: 'System', icon: 'grafana.svg', url: 'http://192.168.1.60:3000' };
const NEW_PROXY = { title: 'Proxmox', category: 'System', subdomain: 'proxmox', backendUrl: 'https://192.168.1.50:8006' };
const ICON_SEARCH = 'proxmox';

const kebab = (title) => {
	return title.toLowerCase().trim().replace(/\s+/g, '-');
};

const iconUrl = (file) => {
	const extension = file.split('.').pop();
	return `${ICON_CDN}/${extension}/${file}`;
};

const shortcuts = (clusterDomain, firstId = 100) => {
	return SHORTCUTS.map((shortcut, index) => {
		const url = (shortcut.traefik ? `https://${shortcut.traefik.subdomain}.${clusterDomain}` : shortcut.url);
		return { id: firstId + index, type: 'shortcut', name: kebab(shortcut.title), title: shortcut.title, category: shortcut.category, icon: shortcut.icon, url, traefik: shortcut.traefik ?? null };
	});
};

export {
	NEW_LINK,
	NEW_PROXY,
	ICON_SEARCH,
	iconUrl,
	shortcuts
};
