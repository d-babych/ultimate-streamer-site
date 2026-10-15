import { readFileSync } from "node:fs";

export const languages = JSON.parse(readFileSync(new URL("../src/_data/languages.json", import.meta.url), "utf8"));
export const DEFAULT_LANG = "en";

// The page's file name without extension. Not page.fileSlug: for index.njk Eleventy returns the folder name.
export const fileName = (data) => data.page.filePathStem.split("/").pop();

// Directory data for src/<lang>/. Sets the language and derives every page's URL from its file name:
//   src/en/tennis-live-streaming.njk -> /tennis-live-streaming.html
//   src/uk/tennis-live-streaming.njk -> /uk/tennis-live-streaming.html
// A page can set `slug` in its front matter to use a different URL name than its file name.
// To add a language: add it to src/_data/languages.json, then create src/<lang>/<lang>.11tydata.js
// containing: import { langDir } from "../../lib/lang.js"; export default langDir("<lang>");
export function langDir(lang) {
  return {
    lang,
    eleventyComputed: {
      permalink: (data) => `${languages[lang].prefix}/${data.slug || fileName(data)}.html`,
    },
  };
}

// UI strings for a language: its own strings on top of the English ones (a missing string falls back to English).
export function mergeStrings(base, over = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(over)) {
    out[key] = value && typeof value === "object" && !Array.isArray(value) ? mergeStrings(base[key], value) : value;
  }
  return out;
}

const pageOf = (pages, key, lang) => pages.find((p) => p.data.translationKey === key && p.data.lang === lang);

// A link to the page with this key in `lang`; falls back to the English page (and says so in `lang`)
// when that page is not translated yet. `labelField` is the front matter field holding the link text.
export function pageRef(pages, key, lang, labelField) {
  const english = pageOf(pages, key, DEFAULT_LANG);
  const page = pageOf(pages, key, lang) || english;
  if (!page) throw new Error(`pageRef: there is no page with key "${key}"`);
  const label = page.data[labelField] ?? english?.data[labelField];
  if (!label) throw new Error(`pageRef: page "${key}" has no "${labelField}" in front matter`);
  return { url: page.url, label, lang: page.data.lang };
}

// All language versions of a page (the pages sharing a translation key), in the order of languages.json.
export function alternates(pages, key) {
  return Object.entries(languages)
    .map(([lang, info]) => ({ lang, info, page: pageOf(pages, key, lang) }))
    .filter((x) => x.page)
    .map(({ lang, info, page }) => ({
      lang,
      url: page.url,
      hreflang: info.hreflang,
      htmlLang: info.htmlLang,
      ogLocale: info.ogLocale,
      native: info.native,
      isDefault: Boolean(info.default),
    }));
}

export const format = (template, vars) => String(template).replace(/\{(\w+)\}/g, (m, name) => vars[name] ?? m);
