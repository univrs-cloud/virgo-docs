// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import autoImport from 'astro-auto-import';
import brokenLinksChecker from 'astro-broken-links-checker';

export default defineConfig({
	site: 'https://docs.univrs.cloud',
	integrations: [
		starlight({
			title: 'univrs',
			logo: {
				src: './src/assets/univrs.svg'
			},
			favicon: '/favicon.ico',
			customCss: ['./src/styles/univrs.css'],
			components: {
				Head: './src/components/Head.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				Pagination: './src/components/Pagination.astro',
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
