declare namespace StarlightApp {
	type UIStrings = typeof import('./content/i18n/en.json');
	interface I18n extends UIStrings {}
}

declare module 'virtual:starlight/user-config' {
	const config: import('@astrojs/starlight/types').StarlightConfig;
	export default config;
}

declare module 'astro-broken-links-checker' {
	export default function brokenLinksChecker(options?: {
		checkExternalLinks?: boolean;
		cacheExternalLinks?: boolean;
		throwError?: boolean;
		linkCheckerDir?: string;
	}): import('astro').AstroIntegration;
}
