import { fileName, mergeStrings } from "../../lib/lang.js";
import { article, faqPage, softwareApplication } from "../../lib/schema.js";

export default {
  // Pages in different languages that are translations of each other share this key (the file name by default).
  translationKey: (data) => data.key || fileName(data),

  // UI strings for this page's language (English for anything not translated yet) and its home page URL.
  t: (data) => mergeStrings(data.ui.en, data.ui[data.lang]),
  homeUrl: (data) => data.lang && `${data.languages[data.lang].prefix}/`,

  // JSON-LD blocks every page gets from its front matter (app, article, faq); base.njk prints them.
  // Other types (VideoObject, HowTo, Product) stay hand-written in the page's head_extra block.
  jsonLd: (data) =>
    [
      data.app && softwareApplication(data.site, data.app, data.t.appDescription),
      data.article && article(data.site, data),
      data.faq && faqPage(data.faq, data.languages[data.lang].htmlLang),
    ].filter(Boolean),
};
