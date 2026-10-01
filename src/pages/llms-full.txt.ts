import type { APIRoute } from 'astro';
import { allPages, pageDocument, project } from '../llms';

export const GET: APIRoute = async ({ site }) => {
	const pages = await allPages();
	const { name, description } = await project();
	const body = [
		`# ${name}`,
		`> ${description}`,
		...pages.map((page) => ['---', pageDocument(page, site)].join('\n\n'))
	].join('\n\n');

	return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
