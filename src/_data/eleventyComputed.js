import { article, faqPage, softwareApplication } from "../../lib/schema.js";

// JSON-LD blocks every page gets from its front matter (app, article, faq); base.njk prints them.
// Other types (VideoObject, HowTo, Product) stay hand-written in the page's head_extra block.
export default {
  jsonLd: (data) =>
    [
      data.app && softwareApplication(data.site, data.app),
      data.article && article(data.site, data),
      data.faq && faqPage(data.faq),
    ].filter(Boolean),
};
