import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import config from 'virtual:starlight/user-config';

export type Page = CollectionEntry<'docs'>;

export const project = async () => {
	const home = await getEntry('docs', 'index');

	return {
		name: home?.data.title ?? '',
		description: [home?.data.hero?.tagline, home?.data.description].filter(Boolean).join(' '),
		links: (config.social ?? []).map(({ label, href }) => ({ label, url: href }))
	};
};

type SidebarItem = NonNullable<typeof config.sidebar>[number];

const directoriesOf = (items: SidebarItem[]): string[] => {
	return items.flatMap((item) => {
		if (typeof item === 'string') {
			return [];
		}

		if ('autogenerate' in item) {
			return [item.autogenerate.directory];
		}

		return ('items' in item ? directoriesOf(item.items) : []);
	});
};

export const sections = (config.sidebar ?? []).flatMap((group) => {
	if (typeof group === 'string' || !('items' in group)) {
		return [];
	}

	return directoriesOf(group.items).map((directory) => ({ directory, label: group.label }));
});

const directoryOf = (page: Page) => (page.id.split('/')[0] ?? '').toLowerCase();

const orderOf = (page: Page) => page.data.sidebar.order ?? Number.MAX_SAFE_INTEGER;

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export const hasMarkdown = (id: string) => {
	return sections.some(({ directory }) => (id.split('/')[0] ?? '').toLowerCase() === directory.toLowerCase());
};

export const pagePath = (page: Page) => `/${page.id}/`;

export const pageMarkdownPath = (page: Page) => `/${page.id}.md`;

export const sectionPages = async (directory: string) => {
	const pages = await getCollection('docs', (page) => directoryOf(page) === directory.toLowerCase());

	return pages.sort((a, b) => orderOf(a) - orderOf(b) || a.id.localeCompare(b.id));
};

export const allPages = async () => {
	const groups = await Promise.all(sections.map(({ directory }) => sectionPages(directory)));

	return groups.flat();
};

export const pageMarkdown = (page: Page, origin: URL | undefined) => {
	const base = new URL('/', origin).href;

	return (page.body ?? '')
		.replace(/^import .*$/gm, '')
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '_$1_')
		.replace(/^<\/?Tabs[^>]*>$/gm, '')
		.replace(/^<TabItem label="([^"]+)">$/gm, '**$1**')
		.replace(/^<\/TabItem>$/gm, '')
		.replace(/^:::(\w+)\[([^\]]+)\]$/gm, (_match, type: string, title: string) => `**${capitalize(type)}: ${title}**\n`)
		.replace(/^:::(\w+)$/gm, (_match, type: string) => `**${capitalize(type)}**\n`)
		.replace(/^:::$/gm, '')
		.replace(/\]\(\//g, `](${base}`)
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};

export const pageDocument = (page: Page, origin: URL | undefined) => {
	return [
		`# ${page.data.title}`,
		`> ${page.data.description}`,
		`Source: ${new URL(pagePath(page), origin).href}`,
		pageMarkdown(page, origin)
	].join('\n\n');
};
