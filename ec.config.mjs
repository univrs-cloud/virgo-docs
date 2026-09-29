import { defineEcConfig } from '@astrojs/starlight/expressive-code';

const SHELL_COLORS = {
	dark: { command: '#D2A8FF', argument: '#7EE787', option: '#79C0FF' },
	light: { command: '#783FFF', argument: '#12924C', option: '#0550AE' }
};

export default defineEcConfig({
	customizeTheme: (theme) => {
		const colors = SHELL_COLORS[theme.type];
		theme.settings.push(
			{ scope: ['entity.name.command.shell', 'entity.name.function.call.shell'], settings: { foreground: colors.command } },
			{ scope: ['string.unquoted.argument.shell'], settings: { foreground: colors.argument } },
			{ scope: ['constant.other.option.dash.shell', 'constant.other.option'], settings: { foreground: colors.option } }
		);
	}
});
