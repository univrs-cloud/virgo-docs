import type { APIRoute } from 'astro';
import { pageMarkdownPath, project, sectionPages, sections } from '../llms';

export const GET: APIRoute = async ({ site }) => {
	const absolute = (path: string) => new URL(path, site).href;
	const { name, description, links } = await project();
	const groups = await Promise.all(sections.map(async ({ directory, label }) => {
		const pages = await sectionPages(directory);

		return [
			`## ${label}`,
			pages.map((page) => `- [${page.data.title}](${absolute(pageMarkdownPath(page))}): ${page.data.description}`).join('\n')
		].join('\n\n');
	}));
	const body = [
		`# ${name}`,
		`> ${description}`,
		`- [llms-full.txt](${absolute('/llms-full.txt')}): the whole manual in one file`,
		...groups,
		'## Optional',
		links.map(({ label, url }) => `- [${label}](${url})`).join('\n')
	].join('\n\n');

	return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
