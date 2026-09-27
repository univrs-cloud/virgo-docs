// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://docs.univrs.cloud',
	integrations: [
		starlight({
			title: 'univrs',
			logo: {
				src: './src/assets/virgo.svg'
			},
			favicon: '/favicon.ico',
			customCss: ['./src/styles/univrs.css'],
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
					label: 'CLI reference',
					items: [{ autogenerate: { directory: 'cli' } }]
				}
			]
		})
	]
});
