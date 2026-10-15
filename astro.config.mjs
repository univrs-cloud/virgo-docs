// @ts-check
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import autoImport from 'astro-auto-import';
import brokenLinksChecker from 'astro-broken-links-checker';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://docs.univrs.cloud';
const DOCS_DIR = 'src/content/docs/';

const pageUrl = (file) => {
	const slug = file.slice(DOCS_DIR.length).replace(/\.mdx?$/i, '').replace(/(^|\/)index$/i, '');
	return `${SITE}/${slug}${(slug ? '/' : '')}`;
};

const pageDates = () => {
	const dates = new Map();
	let log = '';
	try {
		log = execFileSync('git', ['log', '--format=@%cI', '--name-only', '--', DOCS_DIR], { cwd: fileURLToPath(new URL('.', import.meta.url)), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	} catch (error) {
		console.warn(`Sitemap dates unavailable: ${error.message}`);
		return dates;
	}

	let date = null;
	for (const line of log.split('\n')) {
		if (line.startsWith('@')) {
			date = line.slice(1);
		} else if (/\.mdx?$/i.test(line) && !dates.has(pageUrl(line))) {
			dates.set(pageUrl(line), date);
		}
	}

	return dates;
};

const lastmods = pageDates();

export default defineConfig({
	site: SITE,
	integrations: [
		sitemap({
			serialize: (item) => {
				const lastmod = lastmods.get(item.url);
				return (lastmod ? { ...item, lastmod } : item);
			}
		}),
		starlight({
			title: 'univrs',
			logo: {
				src: './src/assets/univrs.svg'
			},
			favicon: '/favicon.ico',
			customCss: ['./src/styles/univrs.css'],
			components: {
				Head: './src/components/Head.astro',
				Header: './src/components/Header.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				MobileMenuFooter: './src/components/MobileMenuFooter.astro',
				MobileMenuToggle: './src/components/MobileMenuToggle.astro',
				Pagination: './src/components/Pagination.astro',
				SiteTitle: './src/components/SiteTitle.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				ThemeSelect: './src/components/ThemeSelect.astro'
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/univrs-cloud' }
			],
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en'
				}
			},
			sidebar: [
				{
					label: 'Setup',
					items: [{ autogenerate: { directory: 'setup' } }]
				},
				{
					label: 'Management',
					items: [{ autogenerate: { directory: 'management' } }]
				},
				{
					label: 'Troubleshooting',
					items: [{ autogenerate: { directory: 'troubleshooting' } }]
				},
				{
					label: 'CLI reference',
					items: [{ autogenerate: { directory: 'cli' } }]
				}
			]
		}),
		autoImport({
			imports: [
				{ '@astrojs/starlight/components': ['Tabs', 'TabItem'] }
			]
		}),
		brokenLinksChecker({
			checkExternalLinks: true,
			throwError: true
		})
	]
});
