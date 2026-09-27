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

## Deployment

Every push to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.
