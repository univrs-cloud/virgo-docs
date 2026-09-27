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
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en'
				}
			},
			sidebar: [
				{
					label: 'CLI reference',
					items: [{ autogenerate: { directory: 'cli' } }]
				}
			]
		})
	]
});
