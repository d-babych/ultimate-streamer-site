import { paragraphs, toScript } from "./lib/schema.js";

export default function (eleventyConfig) {
  // Everything in public/ is copied to the site root as is (assets, css, icons, CNAME, robots.txt, ...).
  eleventyConfig.addPassthroughCopy({ public: "." });
  eleventyConfig.addWatchTarget("public/");

  // JSON-LD and FAQ helpers (see lib/schema.js and src/_data/eleventyComputed.js)
  eleventyConfig.addFilter("ldScript", toScript);
  eleventyConfig.addFilter("asList", paragraphs);

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
