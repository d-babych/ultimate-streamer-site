# Ultimate Streamer site

Static site built with [Eleventy](https://www.11ty.dev/) and hosted on GitHub Pages.

```bash
npm install
npm start        # dev server with live reload on http://localhost:8080
npm run build    # production build into _site/
```

## Layout

| Path | What it is |
|---|---|
| `src/pages/*.njk` | One file per page: front matter (title, description, og/twitter, `lastmod`) + body |
| `src/_includes/base.njk` | HTML skeleton shared by all pages |
| `src/_includes/partials/` | `head`, `nav`, `footer` |
| `src/_data/site.json`, `nav.json` | Site constants and the top menu |
| `src/sitemap.njk` | Generates `sitemap.xml` from the pages' `lastmod` |
| `public/` | Copied to the site root as is: `styles.css`, `navigation.js`, icons, `assets/`, `CNAME`, `robots.txt`, `llms.txt` |

Adding a page: create `src/pages/<slug>.njk` with `permalink: "/<slug>.html"`, `title`, `description`, `lastmod`
and `{% extends "base.njk" %}` (copy an existing page). Add it to `src/_data/nav.json` if it belongs in the menu.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`. In the repository settings,
**Pages → Source** must be set to **GitHub Actions**.
