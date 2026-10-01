import type { APIRoute } from 'astro';
import { allPages, pageDocument, type Page } from '../llms';

export const getStaticPaths = async () => {
	const pages = await allPages();

	return pages.map((page) => ({
		params: { slug: page.id },
		props: { page }
	}));
};

export const GET: APIRoute<{ page: Page }> = ({ props, site }) => {
	return new Response(`${pageDocument(props.page, site)}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
