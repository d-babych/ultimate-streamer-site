// Checks the built site (_site/) against the sources (src/). Run after `npm run build`: `npm run check`.
//
// Errors (exit code 1):
//   - an internal link, image, video or srcset URL that does not resolve to a file, or is not root-relative
//   - a page in one language linking to another language's version of a page that exists in its own language
//   - hreflang problems: missing self-link / x-default, an alternate that does not exist or does not link back,
//     <html lang> or canonical not matching the page
//   - a sitemap that does not list exactly the built pages
//   - invalid JSON-LD, or an inLanguage that does not match the page
//   - a term listed in scripts/glossary.json as forbidden (e.g. "Kiev")
//   - a translated page without an English original
// Warnings (reported, exit code stays 0):
//   - a translated page linking to an English page that has no translation yet
//   - pages that exist in English but not yet in a language that already has pages
//   - translations older than their English source: the English `lastmod` is newer than the
//     translation's `sourceLastmod` (set it to the English lastmod you translated from)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");
const srcDir = path.join(root, "src");
const readJson = (...p) => JSON.parse(readFileSync(path.join(root, ...p), "utf8"));
const languages = readJson("src", "_data", "languages.json");
const site = readJson("src", "_data", "site.json");
const glossary = readJson("scripts", "glossary.json");
const DEFAULT_LANG = Object.keys(languages).find((l) => languages[l].default);

if (!existsSync(siteDir)) {
  console.error("_site/ not found. Run `npm run build` first.");
  process.exit(2);
}

const errors = [];
const warnings = [];
const error = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

// ---- sources: every page template, its language, key, URL
const routes = new Map(); // url -> { lang, key, fm, file }
const byKey = new Map(); // key -> { lang -> route }
for (const lang of Object.keys(languages)) {
  const dir = path.join(srcDir, lang);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".njk"))) {
    const name = file.replace(/\.njk$/, "");
    const fm = matter(readFileSync(path.join(dir, file), "utf8")).data;
    const key = fm.key || name;
    const url = name === "index" && !fm.slug ? `${languages[lang].prefix}/` : `${languages[lang].prefix}/${fm.slug || name}.html`;
    const route = { lang, key, fm, url, file: `src/${lang}/${file}` };
    routes.set(url, route);
    if (!byKey.has(key)) byKey.set(key, {});
    byKey.get(key)[lang] = route;
  }
}

// ---- built pages
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const pages = new Map(); // url -> { $, file, route }
for (const file of walk(siteDir).filter((f) => f.endsWith(".html"))) {
  const rel = "/" + path.relative(siteDir, file).split(path.sep).join("/");
  const url = rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
  pages.set(url, { $: cheerio.load(readFileSync(file, "utf8")), file: rel, route: routes.get(url) });
}
for (const url of routes.keys()) if (!pages.has(url)) error(url, "source page was not built");

const isExternal = (v) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(v) && !v.startsWith("#");
const fileFor = (urlPath) => {
  let p = decodeURIComponent(urlPath);
  if (p.endsWith("/")) p += "index.html";
  const full = path.join(siteDir, p);
  if (existsSync(full) && statSync(full).isFile()) return full;
  if (existsSync(path.join(full, "index.html"))) return path.join(full, "index.html");
  return null;
};
const pageUrlOf = (urlPath) => {
  // /uk/index.html and /uk both mean /uk/
  const u = urlPath.replace(/index\.html$/, "");
  return pages.has(u) ? u : pages.has(u + "/") ? u + "/" : u;
};

// ---- 1. links, assets, language integrity
const idCache = new Map();
const untranslated = new Map(); // page url -> Set of English URLs it links to that have no translation yet
const idsOf = (url) => {
  if (!idCache.has(url)) idCache.set(url, new Set(pages.get(url).$("[id]").map((_, e) => e.attribs.id).get()));
  return idCache.get(url);
};
for (const [url, page] of pages) {
  const { $, route } = page;
  const lang = route?.lang;
  $("[href], [src], [poster], [srcset]").each((_, el) => {
    const refs = [];
    for (const a of ["href", "src", "poster"]) if (el.attribs[a] !== undefined) refs.push({ attr: a, value: el.attribs[a] });
    if (el.attribs.srcset) for (const c of el.attribs.srcset.split(",")) refs.push({ attr: "srcset", value: c.trim().split(/\s+/)[0] });
    for (const { attr, value } of refs) {
      if (!value || isExternal(value)) continue;
      if (value.startsWith("#")) {
        if (value.length > 1 && !idsOf(url).has(decodeURIComponent(value.slice(1)))) warn(url, `anchor ${value} does not exist on this page`);
        continue;
      }
      if (!value.startsWith("/")) { error(url, `${attr}="${value}" is not root-relative`); continue; }
      const [urlPath, fragment] = value.split("#");
      const clean = urlPath.split("?")[0];
      if (!fileFor(clean)) { error(url, `${attr}="${value}" does not exist`); continue; }
      // Language switcher links (hreflang) and menu fallbacks to untranslated pages (lang="en") are meant to cross languages.
      if (el.tagName !== "a" || el.attribs.hreflang || el.attribs.lang) continue;
      const target = pages.get(pageUrlOf(clean));
      if (!target) continue;
      if (fragment && !idsOf(pageUrlOf(clean)).has(decodeURIComponent(fragment))) warn(url, `${value}: anchor #${fragment} does not exist on the target page`);
      const targetRoute = target.route;
      if (!lang || !targetRoute || targetRoute.lang === lang) continue;
      const sameLang = byKey.get(targetRoute.key)?.[lang];
      if (sameLang) error(url, `links to ${value} but the ${lang} version exists: ${sameLang.url}`);
      else if (lang !== DEFAULT_LANG && targetRoute.lang === DEFAULT_LANG) {
        if (!untranslated.has(url)) untranslated.set(url, new Set());
        untranslated.get(url).add(clean);
      }
      else if (lang === DEFAULT_LANG) error(url, `links to ${value} in another language`);
    }
  });
}

for (const [url, targets] of untranslated) warn(url, `links to ${targets.size} page(s) not translated yet: ${[...targets].join(", ")}`);

// ---- 2. language, canonical, hreflang
for (const [url, page] of pages) {
  const { $, route } = page;
  if (!route) { error(url, "built page has no source template"); continue; }
  const info = languages[route.lang];
  if ($("html").attr("lang") !== info.htmlLang) error(url, `<html lang="${$("html").attr("lang")}"> should be "${info.htmlLang}"`);
  const canonical = $('link[rel="canonical"]').attr("href");
  if (canonical !== site.url + url) error(url, `canonical is ${canonical}, expected ${site.url + url}`);
  const alts = $('link[rel="alternate"][hreflang]').map((_, e) => ({ hreflang: e.attribs.hreflang, href: e.attribs.href })).get();
  const expected = Object.entries(byKey.get(route.key)).map(([l, r]) => ({ l, r }));
  if (expected.length < 2) {
    if (alts.length) error(url, "has hreflang links but no translations");
    continue;
  }
  for (const { l, r } of expected) {
    const want = languages[l].hreflang;
    const got = alts.find((a) => a.hreflang === want);
    if (!got) error(url, `missing hreflang="${want}"`);
    else if (got.href !== site.url + r.url) error(url, `hreflang="${want}" points to ${got.href}, expected ${site.url + r.url}`);
  }
  const xd = alts.find((a) => a.hreflang === "x-default");
  const english = byKey.get(route.key)[DEFAULT_LANG];
  if (!english) error(url, `has translations but no ${DEFAULT_LANG} original (x-default)`);
  else if (!xd || xd.href !== site.url + english.url) error(url, `x-default should point to ${site.url + english.url}`);
  if (!alts.find((a) => a.hreflang === info.hreflang)) error(url, "missing self-referencing hreflang");
}

// ---- 3. sitemap lists exactly the built pages
{
  const xml = readFileSync(path.join(siteDir, "sitemap.xml"), "utf8");
  const $x = cheerio.load(xml, { xmlMode: true });
  const locs = new Set($x("url > loc").map((_, e) => $x(e).text()).get());
  for (const url of pages.keys()) {
    if (url === "/404.html") continue;
    if (!locs.has(site.url + url)) error("sitemap.xml", `does not list ${url}`);
  }
  for (const loc of locs) if (!pages.has(loc.slice(site.url.length))) error("sitemap.xml", `lists ${loc}, which was not built`);
}

// ---- 4. JSON-LD
for (const [url, page] of pages) {
  const htmlLang = page.route && languages[page.route.lang].htmlLang;
  page.$('script[type="application/ld+json"]').each((_, el) => {
    let data;
    try { data = JSON.parse(page.$(el).html()); } catch (e) { return error(url, `invalid JSON-LD: ${e.message}`); }
    if (data["@context"] !== "https://schema.org" || !data["@type"]) error(url, "JSON-LD without @context/@type");
    if (["Article", "FAQPage"].includes(data["@type"]) && data.inLanguage !== htmlLang) error(url, `${data["@type"]} inLanguage is "${data.inLanguage}", expected "${htmlLang}"`);
  });
}

// ---- 5. glossary: forbidden terms (scripts/glossary.json)
for (const rule of glossary.forbidden) {
  const re = new RegExp(rule.pattern, rule.flags || "i");
  for (const [url, page] of pages) {
    const lang = page.route?.lang;
    if (rule.langs !== "all" && !rule.langs.includes(lang)) continue;
    const text = [page.$("title").text(), page.$('meta[name="description"]').attr("content"), page.$("body").text()].join("\n");
    const m = text.match(re);
    if (m) error(url, `forbidden term "${m[0]}": ${rule.message}`);
  }
}

// ---- 6. translation coverage and freshness
for (const route of routes.values()) {
  if (route.lang === DEFAULT_LANG) continue;
  const english = byKey.get(route.key)[DEFAULT_LANG];
  if (!english) { error(route.url, `${route.file} has no English original (key "${route.key}")`); continue; }
  const source = route.fm.sourceLastmod && String(route.fm.sourceLastmod instanceof Date ? route.fm.sourceLastmod.toISOString().slice(0, 10) : route.fm.sourceLastmod);
  const current = String(english.fm.lastmod instanceof Date ? english.fm.lastmod.toISOString().slice(0, 10) : english.fm.lastmod);
  if (!source) warn(route.url, `no sourceLastmod in ${route.file} (set it to the English lastmod you translated from: ${current})`);
  else if (current > source) warn(route.url, `English page changed on ${current}, translation is based on ${source}`);
}
for (const lang of Object.keys(languages)) {
  if (lang === DEFAULT_LANG) continue;
  const have = [...routes.values()].filter((r) => r.lang === lang);
  if (!have.length) continue;
  const missing = [...routes.values()].filter((r) => r.lang === DEFAULT_LANG && !byKey.get(r.key)[lang]).map((r) => r.key);
  if (missing.length) warn(`[${lang}]`, `${have.length} of ${have.length + missing.length} pages translated; missing: ${missing.join(", ")}`);
}

// ---- report
const nPages = pages.size;
for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);
console.log(`\n${nPages} pages checked: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
