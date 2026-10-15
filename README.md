# Ultimate Streamer site

Static site built with [Eleventy](https://www.11ty.dev/) and hosted on GitHub Pages.

```bash
npm install
npm start          # dev server with live reload on http://localhost:8080
npm run build      # production build into _site/
npm run check      # quality checks of the built site (run build first)
npm run verify     # build + check
```

## Layout

| Path | What it is |
|---|---|
| `src/en/*.njk` | The English pages, one file per page: front matter + body. Other languages get their own `src/<lang>/` folder with full pages |
| `src/<lang>/<lang>.11tydata.js` | Sets the language of a folder and derives every URL from the file name (see `lib/lang.js`) |
| `src/_includes/base.njk` | HTML skeleton shared by all pages |
| `src/_includes/partials/` | `head` (meta, hreflang), `nav` (menu + language switcher), `footer`, `faq`, `trusted` |
| `src/_data/site.json` | Site constants (incl. `app`: SoftwareApplication defaults) |
| `src/_data/languages.json` | The languages: URL prefix, `<html lang>`, hreflang, og:locale, native name |
| `src/_data/ui.json` | Strings of the shared chrome (menu groups, aria-labels, footer text, default app description) per language; a missing string falls back to English |
| `src/_data/nav.json` | Menu structure: page keys only. The link text comes from the page itself (`navLabel`, `footerLabel`) |
| `src/_data/testimonials.json` | Customer quotes, referenced by id from pages |
| `src/_data/eleventyComputed.js`, `lib/schema.js` | Build the JSON-LD blocks from a page's front matter |
| `src/sitemap.njk` | Generates `sitemap.xml` (with hreflang alternates) from the pages' `lastmod` |
| `public/` | Copied to the site root as is: `styles.css`, `navigation.js`, `site.js` (FAQ accordion, scroll reveal, hero typing), icons, `assets/`, `CNAME`, `robots.txt`, `llms.txt` |
| `scripts/check.mjs`, `scripts/glossary.json` | `npm run check`: quality checks of the built site |

Adding a page: copy an existing `src/en/<slug>.njk`, change `title`, `description`, `lastmod` (the URL is `/<slug>.html`, taken
from the file name), and add `navLabel` / `footerLabel` if the page appears in the menu or footer (and its key to `src/_data/nav.json`).
Always use root-relative links in bodies: `/assets/...`, `/tennis-live-streaming.html`.

## Languages

English lives in the site root, other languages under a prefix (`/es/`, `/pt/`, `/uk/`). Every language has **full pages**, translated
and adapted as needed, not a key-by-key translation. Slugs stay English.

Adding a language: it is already listed in `languages.json`. Create `src/<lang>/<lang>.11tydata.js`:

```js
import { langDir } from "../../lib/lang.js";
export default langDir("uk");
```

Translating a page: copy `src/en/<slug>.njk` to `src/<lang>/<slug>.njk` (same file name = same page in every language), translate
everything, and in the front matter add `sourceLastmod: "<the English page's lastmod you translated from>"`. Then:

- internal links in the body must point to the same language (`/uk/tennis-live-streaming.html`);
- `navLabel` / `footerLabel` are the link texts of this page in the menu and footer of its language;
- hreflang, the language switcher, og:locale and the sitemap alternates appear automatically for pages that have translations;
- menu and footer of a language link to the English page (marked `lang="en"`) until that page is translated;
- to translate the shared chrome (menu groups, aria-labels, footer text, app description), add the language's block to `src/_data/ui.json`;
- translate the hero words of the home page in `data-words` of its `<h1 data-typing-brand>`.

`npm run check` (also run in CI before every deploy) fails on broken or relative links, links to another language when a
same-language page exists, wrong hreflang/canonical/`<html lang>`, a sitemap that does not match the pages, invalid JSON-LD, forbidden
terms from `scripts/glossary.json` (e.g. "Kiev") and translations without an English original. It warns about untranslated pages,
links to untranslated pages, and translations older than their English source (English `lastmod` newer than `sourceLastmod`).

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

Pushing to `main` runs `.github/workflows/deploy.yml` (build, `npm run check`, publish). In the repository settings,
**Pages → Source** must be set to **GitHub Actions**.
