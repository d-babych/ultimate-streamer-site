import { readFileSync } from "node:fs";
import { tagAppStoreLinks } from "./lib/appstore.js";
import { alternates, format, pageIn, pageRef } from "./lib/lang.js";
import { paragraphs, toScript } from "./lib/schema.js";

export default function (eleventyConfig) {
  // Everything in public/ is copied to the site root as is (assets, css, icons, CNAME, robots.txt, ...).
  eleventyConfig.addPassthroughCopy({ public: "." });
  eleventyConfig.addWatchTarget("public/");

  // JSON-LD and FAQ helpers (see lib/schema.js and src/_data/eleventyComputed.js)
  eleventyConfig.addFilter("ldScript", toScript);
  eleventyConfig.addFilter("asList", paragraphs);

  // Language helpers (see lib/lang.js)
  eleventyConfig.addFilter("pageRef", pageRef);
  eleventyConfig.addFilter("alternates", alternates);
  eleventyConfig.addFilter("pageIn", pageIn);
  eleventyConfig.addFilter("fmt", format);

  // Campaign tracking of every link to our App Store page (see lib/appstore.js, docs/app-store-links.md)
  const site = JSON.parse(readFileSync(new URL("./src/_data/site.json", import.meta.url), "utf8"));
  eleventyConfig.addTransform("appStoreLinks", function (content) {
    return this.page.outputPath?.endsWith(".html") ? tagAppStoreLinks(content, site, this.page) : content;
  });

  // Pages that have a lastmod date, home page first, then newest first.
  eleventyConfig.addFilter("sortSitemap", (pages) =>
    pages
      .filter((p) => p.data.lastmod)
      .sort((a, b) => (a.url === "/" ? -1 : b.url === "/" ? 1 : 0) || String(b.data.lastmod).localeCompare(String(a.data.lastmod)))
  );

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
