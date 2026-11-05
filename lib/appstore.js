// Campaign tracking of the links to our App Store page (see docs/app-store-links.md).
// At build time every <a> pointing at our app gets `pt`, `ct` and `mt` in its URL, plus
// data-app-store-placement (where on the page the link is) and data-site-language (the site's language code).
import * as cheerio from "cheerio";
import { DEFAULT_LANG, languages } from "./lang.js";

// The attribute `name` of an opening tag: { text: whole attribute as written, value } or null.
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s(${name})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"));
  return m && { text: m[0], value: m[2] ?? m[3] ?? m[4] };
}

const decode = (s) => s.replace(/&amp;/g, "&");
const encode = (s) => s.replace(/&/g, "&amp;");

// ct for a page: "site-<page key>", with the language code after "site-" for every language but the default one.
export function campaignOf(tracking, lang, fileName) {
  const key = tracking.pageKeys[fileName];
  if (!key) throw new Error(`App Store tracking: page "${fileName}" has no key in site.json appStoreTracking.pageKeys`);
  return lang === DEFAULT_LANG ? `site-${key}` : `site-${lang}-${key}`;
}

// The URL if `href` is a link to our app (apps.apple.com and our app id), otherwise null.
export function ownAppUrl(href, appId) {
  let url;
  try {
    url = new URL(decode(href));
  } catch {
    return null;
  }
  return url.hostname === "apps.apple.com" && new RegExp(`/id${appId}(?:/|$)`).test(url.pathname) ? url : null;
}

// Where on the page a link is (hero, bottom-cta, nav, inline):
//   1. a valid data-app-store-placement attribute wins, classes are not looked at (an invalid one is an error);
//   2. otherwise the class from the placementClasses map (classes with different placements are an error);
//   3. no attribute and no classes: inline;
//   4. classes, but none of them known: an error.
export function placementOf(tracking, explicit, classNames) {
  if (explicit !== undefined) {
    if (!tracking.placements.includes(explicit)) throw new Error(`data-app-store-placement="${explicit}" is not one of: ${tracking.placements.join(", ")}`);
    return explicit;
  }
  const classes = classNames.split(/\s+/).filter(Boolean);
  if (!classes.length) return "inline";
  const found = [...new Set(classes.filter((c) => c in tracking.placementClasses).map((c) => tracking.placementClasses[c]))];
  if (found.length > 1) throw new Error(`classes "${classes.join(" ")}" give different placements (${found.join(", ")}); set data-app-store-placement`);
  if (!found.length) throw new Error(`none of the classes "${classes.join(" ")}" is in site.json appStoreTracking.placementClasses; add the class there or set data-app-store-placement`);
  return found[0];
}

// The language and file name of a page from Eleventy's page.filePathStem ("/uk/tennis-live-streaming").
export function pageOf(filePathStem) {
  const [, lang, ...rest] = String(filePathStem).split("/");
  return languages[lang] && rest.length ? { lang, fileName: rest[rest.length - 1] } : null;
}

// Rewrites the opening tag of one link (`tag` is its text as written in the page); other links are returned as they are.
function tagLink(tag, site, page) {
  const tracking = site.appStoreTracking;
  const href = attr(tag, "href");
  const url = href && ownAppUrl(href.value, site.appStoreId);
  if (!url) return tag;

  const where = `${page.url}: link to the App Store`;
  const info = pageOf(page.filePathStem);
  if (!info) throw new Error(`${where}: cannot tell the language of ${page.filePathStem}`);
  for (const p of ["pt", "ct", "mt"]) if (url.searchParams.has(p)) throw new Error(`${where}: already has "${p}", it is added by the build`);
  if (attr(tag, "data-site-language")) throw new Error(`${where}: data-site-language is added by the build`);

  const explicit = attr(tag, "data-app-store-placement");
  let placement;
  try {
    placement = placementOf(tracking, explicit?.value, attr(tag, "class")?.value ?? "");
  } catch (e) {
    throw new Error(`${where}: ${e.message}`);
  }

  url.searchParams.set("pt", tracking.providerToken);
  url.searchParams.set("ct", campaignOf(tracking, info.lang, info.fileName));
  url.searchParams.set("mt", tracking.mediaType);

  const out = tag.replace(href.text, `${href.text.match(/^\s*/)[0]}href="${encode(url.toString())}"`);
  const extra = `${explicit ? "" : ` data-app-store-placement="${placement}"`} data-site-language="${info.lang}"`;
  return out.replace(/\s*\/?>$/, (end) => extra + end);
}

// Tags every link to our app in a page's HTML. `page` is { filePathStem, url } of the Eleventy page.
// Only real <a> elements are touched (not links written inside comments, <script> or <style>): the page is parsed
// to find where each <a> start tag is, and only those tags are rewritten, so the rest of the HTML stays byte for byte.
export function tagAppStoreLinks(html, site, page) {
  if (!html.includes("apps.apple.com")) return html;
  // scriptingEnabled: false parses <noscript> content as elements, so links in it are found too
  const $ = cheerio.load(html, { sourceCodeLocationInfo: true, scriptingEnabled: false });
  const edits = [];
  $("a[href]").each((_, el) => {
    const { startOffset, endOffset } = el.sourceCodeLocation.startTag;
    const tag = html.slice(startOffset, endOffset);
    const out = tagLink(tag, site, page);
    if (out !== tag) edits.push({ startOffset, endOffset, out });
  });
  return edits.reduceRight((acc, e) => acc.slice(0, e.startOffset) + e.out + acc.slice(e.endOffset), html);
}
