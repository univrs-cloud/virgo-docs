# virgo-docs

User manual for virgoOS, built with [Astro Starlight](https://starlight.astro.build) and published at [docs.univrs.cloud](https://docs.univrs.cloud).

## Development

```sh
npm install
npm run dev
```

Pages live in `src/content/docs/`. English is the root locale; another language goes in its own folder (for example `src/content/docs/ro/`) once it is added to `locales` in `astro.config.mjs`.

## CLI reference

`src/content/docs/cli/` is generated from the `virgo` command in [virgo-api](https://github.com/univrs-cloud/virgo-api). Do not edit it by hand.

```sh
npm run cli-reference
```

The script expects a virgo-api checkout with its dependencies installed at `../virgo-api`. Set `VIRGO_API` to use another path.

## Screenshots

`src/assets/<section>/` is rendered from [virgo-ui](https://github.com/univrs-cloud/virgo-ui), fed by a fake backend with made-up data. Do not edit it by hand.

```sh
npm run screenshots                                    # every section
npm run screenshots -- setup                           # one section
npm run screenshots -- setup/storage management/users  # single pages
```

The script serves the build at `../virgo-ui/dist`, so build virgo-ui first. It also reads socket.io and the pool layouts from `../virgo-api`, and app icons from `../virgo-apps/images`. Set `VIRGO_UI`, `VIRGO_API`, `VIRGO_APPS` or `CHROME_PATH` to use other paths.

- `scripts/screenshots/scenes/` has one file per section, with one entry per docs page. Each page sets up its own state, so it can be rendered on its own.
- `scripts/screenshots/data/` holds the fake data, one file per topic.
- Screenshots no longer produced by a section are deleted only when the whole section is rendered.

## Language models

The build generates these from the pages, through `src/pages/` and `src/llms.ts`. Nothing in them is written by hand: the name and description come from the home page, the sections from the sidebar and the closing links from the social links in `astro.config.mjs`, so a new page or section shows up by itself:

- `llms.txt`, an index of every page by section.
- `llms-full.txt`, the whole manual in one file.
- A Markdown version of every page, at the page's address with `.md` in place of the trailing slash.

`public/robots.txt` allows every crawler and states that the content may be used for search, as AI input and for AI training.

## Deployment

Every push to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.
