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
| `src/_data/site.json`, `nav.json` | Site constants (incl. `app`: SoftwareApplication defaults) and the top menu |
| `src/_data/testimonials.json` | Customer quotes, referenced by id from pages |
| `src/_data/eleventyComputed.js`, `lib/schema.js` | Build the JSON-LD blocks from a page's front matter |
| `src/sitemap.njk` | Generates `sitemap.xml` from the pages' `lastmod` |
| `public/` | Copied to the site root as is: `styles.css`, `navigation.js`, `site.js` (FAQ accordion + scroll reveal), icons, `assets/`, `CNAME`, `robots.txt`, `llms.txt` |

Adding a page: create `src/pages/<slug>.njk` with `permalink: "/<slug>.html"`, `title`, `description`, `lastmod`
and `{% extends "base.njk" %}` (copy an existing page). Add it to `src/_data/nav.json` if it belongs in the menu.

## Page data (front matter)

Instead of copying markup, a page describes its blocks in front matter and the layout renders them:

```yaml
app: {}                      # SoftwareApplication JSON-LD; optional: description, category
article:                     # Article JSON-LD; optional: author: person, headline, description, image
  datePublished: "2026-05-03"
  dateModified: "2026-05-03"
faq:                         # FAQ section + FAQPage JSON-LD from one source
  title: "FAQ: Tennis Live Streaming"
  items:
    - q: "Question?"
      a: >-
        Answer text (a list of strings gives several paragraphs; HTML like <a> is allowed).
trusted:                     # testimonials section; items are ids from src/_data/testimonials.json
  title: "Used by real sports organizers."
  subtitle: >-
    One sentence.
  items: [ufdf]
revealSelectors: [".some-class"]   # optional: elements that get the scroll-reveal class from JS
```

The FAQ text is the single source for both the visible answers and the JSON-LD, so they cannot drift apart.
VideoObject, HowTo and Product JSON-LD are still written by hand in the page's `head_extra` block.
Internal links and assets in page bodies use root-relative paths (`/assets/...`, `/tennis-live-streaming.html`).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`. In the repository settings,
**Pages → Source** must be set to **GitHub Actions**.
