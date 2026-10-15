// schema.org JSON-LD builders. Pages describe themselves in front matter; the layout calls these.

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

export function plainText(html) {
  return String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
}

export function paragraphs(answer) {
  return Array.isArray(answer) ? answer : [answer];
}

const CONTEXT = "https://schema.org";

// SoftwareApplication: constants come from site.json ("app") and the language's ui strings; a page may override description and category.
export function softwareApplication(site, app, defaultDescription) {
  return {
    "@context": CONTEXT,
    "@type": "SoftwareApplication",
    name: site.name,
    operatingSystem: site.app.operatingSystem,
    applicationCategory: app.category || site.app.category,
    description: app.description || defaultDescription,
    image: site.url + site.app.image,
    url: site.url + "/",
    offers: { "@type": "Offer", price: site.app.price, priceCurrency: site.app.currency },
  };
}

// Article: headline/description default to the page's og:title and meta description.
// author: "person" gives a personal byline, otherwise the organization is the author.
export function article(site, data) {
  const art = data.article;
  const htmlLang = data.languages[data.lang].htmlLang;
  const url = data.canonical || site.url + data.page.url;
  const author = art.author === "person"
    ? { "@type": "Person", name: site.author.name }
    : { "@type": "Organization", name: site.name };
  const out = {
    "@context": CONTEXT,
    "@type": "Article",
    inLanguage: htmlLang,
    headline: art.headline || data.ogTitle || data.title,
    description: art.description || data.description,
    author,
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: site.url + site.app.image },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
  if (art.image) out.image = art.image.map((src) => site.url + src);
  if (art.datePublished) out.datePublished = art.datePublished;
  if (art.dateModified) out.dateModified = art.dateModified;
  return out;
}

export function faqPage(faq, inLanguage) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: plainText(paragraphs(item.a).join(" ")) },
    })),
  };
}

// JSON for an inline <script type="application/ld+json">; "<" is escaped so the data can never close the tag.
export function toScript(data) {
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}
