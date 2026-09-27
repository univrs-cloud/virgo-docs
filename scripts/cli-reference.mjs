import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_DIR = path.resolve(ROOT, process.env.VIRGO_API || '../virgo-api');
const OUT_DIR = path.join(ROOT, 'src/content/docs/cli');
const FQDN_PLACEHOLDER = 'node.cluster.example.com';

const loadProgram = async () => {
	const require = createRequire(path.join(API_DIR, 'package.json'));
	const { Command } = await import(pathToFileURL(require.resolve('commander')).href);
	let program = null;
	Command.prototype.parse = function () {
		program = this;
		return this;
	};
	await import(pathToFileURL(path.join(API_DIR, 'cli/virgo')).href);
	if (program === null) {
		throw new Error(`No program was parsed by ${path.join(API_DIR, 'cli/virgo')}.`);
	}
	return program;
};

const getHostFQDN = () => {
	try {
		return execFileSync('hostname', ['-f'], { encoding: 'utf8' }).trim().split(/\r?\n/)[0] || '';
	} catch {
		return '';
	}
};

const hostFQDN = getHostFQDN();

const clean = (text) => {
	const value = String(text ?? '');
	if (hostFQDN === '') {
		return value;
	}
	return value.split(hostFQDN).join(FQDN_PLACEHOLDER);
};

const escapeCell = (text) => {
	return clean(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('|', '\\|');
};

const escapeCode = (text) => {
	return clean(text).replaceAll('|', '\\|');
};

const isHelpOption = (option) => {
	return option.long?.toLowerCase() === '--help';
};

const visibleCommands = (help, cmd) => {
	return help.visibleCommands(cmd).filter((sub) => { return sub.name().toLowerCase() !== 'help'; });
};

const visibleOptions = (help, cmd) => {
	return help.visibleOptions(cmd).filter((option) => { return !isHelpOption(option); });
};

const commandPath = (cmd) => {
	const names = [];
	for (let current = cmd; current; current = current.parent) {
		names.unshift(current.name());
	}
	return names.join(' ');
};

const slugify = (text) => {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

const renderOptions = (help, options) => {
	const lines = [
		'| Option | Required | Description |',
		'| --- | --- | --- |'
	];
	for (const option of options) {
		lines.push(`| \`${escapeCode(help.optionTerm(option))}\` | ${option.mandatory ? 'Yes' : 'No'} | ${escapeCell(help.optionDescription(option))} |`);
	}
	return lines;
};

const renderArguments = (help, args) => {
	const lines = [
		'| Argument | Required | Description |',
		'| --- | --- | --- |'
	];
	for (const argument of args) {
		lines.push(`| \`${escapeCode(argument.name())}\` | ${argument.required ? 'Yes' : 'No'} | ${escapeCell(help.argumentDescription(argument))} |`);
	}
	return lines;
};

const renderCommand = (help, cmd) => {
	const lines = [`## ${commandPath(cmd)}`, ''];
	const description = help.commandDescription(cmd);
	if (description) {
		lines.push(escapeCell(description), '');
	}
	lines.push('```sh', clean(help.commandUsage(cmd)), '```', '');
	if (cmd.aliases().length > 0) {
		lines.push(`Alias: ${cmd.aliases().map((alias) => { return `\`${escapeCode(alias)}\``; }).join(', ')}`, '');
	}
	const args = help.visibleArguments(cmd);
	if (args.length > 0) {
		lines.push(...renderArguments(help, args), '');
	}
	const options = visibleOptions(help, cmd);
	if (options.length > 0) {
		lines.push(...renderOptions(help, options), '');
	}
	return lines;
};

const collectLeaves = (help, cmd) => {
	const subs = visibleCommands(help, cmd);
	if (subs.length === 0) {
		return [cmd];
	}
	return subs.flatMap((sub) => { return collectLeaves(help, sub); });
};

const frontmatter = (title, description, order, label) => {
	const lines = ['---', `title: ${JSON.stringify(title)}`];
	if (description) {
		lines.push(`description: ${JSON.stringify(clean(description))}`);
	}
	lines.push('sidebar:');
	if (label) {
		lines.push(`  label: ${JSON.stringify(label)}`);
	}
	lines.push(`  order: ${order}`, '---', '');
	return lines;
};

const renderGroupPage = (help, group, order) => {
	const lines = frontmatter(commandPath(group), help.commandDescription(group), order);
	for (const leaf of collectLeaves(help, group)) {
		lines.push(...renderCommand(help, leaf));
	}
	return lines.join('\n');
};

const renderIndexPage = (help, program, groups) => {
	const lines = frontmatter('CLI reference', `Reference for the ${program.name()} command line tool.`, 0, 'Overview');
	lines.push(
		`Every Virgo node ships with the \`${program.name()}\` command. This reference matches version ${program.version()}.`,
		'',
		'```sh',
		clean(help.commandUsage(program)),
		'```',
		'',
		`Add \`--help\` to any command to print its usage in the terminal.`,
		'',
		'## Commands',
		'',
		'| Command | Description |',
		'| --- | --- |'
	);
	for (const group of groups) {
		lines.push(`| [\`${escapeCode(commandPath(group))}\`](/cli/${slugify(group.name())}/) | ${escapeCell(help.commandDescription(group))} |`);
	}
	const options = visibleOptions(help, program);
	if (options.length > 0) {
		lines.push('', '## Global options', '', ...renderOptions(help, options));
	}
	lines.push('');
	return lines.join('\n');
};

const program = await loadProgram();
const help = program.createHelp();
const groups = visibleCommands(help, program);

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.md'), renderIndexPage(help, program, groups));
groups.forEach((group, index) => {
	fs.writeFileSync(path.join(OUT_DIR, `${slugify(group.name())}.md`), renderGroupPage(help, group, index + 1));
});

console.log(`Wrote ${groups.length + 1} pages to ${path.relative(ROOT, OUT_DIR)} from ${program.name()} ${program.version()}.`);
