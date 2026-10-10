/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./InsightsClient.module.css";

type Locale = "en" | "fr";
type Category = "all" | "real-estate" | "visualization" | "marketing" | "websites";

type Article = {
  slug: string;
  category: Exclude<Category, "all">;
  label: string;
  date: string;
  read: string;
  title: string;
  excerpt: string;
  image: string;
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
};

const articles: Article[] = [
  {
    slug: "3d-visualization-sell-development-before-construction",
    category: "visualization",
    label: "CGI & visualization",
    date: "May 12, 2026",
    read: "6 min read",
    title: "Why 3D Visualization Helps Sell a Development Before Construction",
    excerpt: "When a building is still lines on a plan, a strong visual gives buyers a place to begin imagining their life there.",
    image: "/myexperience-hero-night.webp",
    sections: [
      { heading: "Make the future feel present", paragraphs: ["Pre-construction buyers are asked to make a decision about a place they cannot visit yet. Floor plans explain dimensions, but they rarely create an emotional response. Architectural visualization closes that gap by turning an idea into a believable experience.", "A well-built render shows more than a facade. It gives context to the light, the landscape, the materials and the scale of the street. A buyer can understand where the morning sun falls, how a living room opens to a terrace and what the building contributes to its neighbourhood."] },
      { heading: "Use a visual system, not a single hero image", paragraphs: ["One image can earn attention. A coherent image system helps a buyer understand the whole offer. Each scene should answer a different question while keeping the same light, materials and visual language."], bullets: ["An exterior image that establishes the project and its setting.", "Interior scenes that make the floor plans memorable.", "Detail views for finishes, kitchens and amenities.", "Plans, diagrams or animated sequences that clarify the buyer journey."] },
      { heading: "Connect the image to the next step", paragraphs: ["Visualization is most valuable when it is connected to a sales plan. Every image should lead somewhere: a floor plan, a registration form, a viewing request or a conversation with the sales team. At BrotherStudio, CGI, web and lead generation work together so the visual does more than look good. It moves the project forward."] },
    ],
  },
  {
    slug: "cgi-vs-photography-new-property",
    category: "visualization",
    label: "CGI & visualization",
    date: "May 5, 2026",
    read: "5 min read",
    title: "CGI vs Photography: What Should You Use to Market a New Property?",
    excerpt: "The right choice depends on the stage of the project, the decision you want to influence and the story the property needs to tell.",
    image: "/myproject-cover.webp",
    sections: [
      { heading: "Choose photography when the experience already exists", paragraphs: ["Photography is the right tool when the space is built, styled and ready to be experienced. It captures honest material texture, natural imperfection and the details that make a completed property feel real. For listings, amenities and finished show homes, good photography builds trust quickly."] },
      { heading: "Choose CGI when the decision comes before the building", paragraphs: ["CGI becomes essential when there is no finished space to photograph. It can communicate an unbuilt residence, a renovation, a new phase or an interior that is still being specified. It also gives a team control over variables that are difficult to change on a shoot: time of day, furniture, landscaping, weather and camera position.", "That flexibility matters commercially. A developer can test a visual direction before committing to construction, then create a family of images that stays consistent as the project moves through approvals and launch."] },
      { heading: "The strongest campaigns use both", paragraphs: ["When a project has a built context, hybrid campaigns are especially effective. Use CGI for the new building and photography for the neighbourhood, surrounding amenities or a finished model suite. The contrast helps buyers understand what is proposed while giving them familiar points of reference."], bullets: ["Early stage: CGI, diagrams and mood-led concept imagery.", "Launch: hero renders, interiors, plans, video and landing pages.", "Completion: photography, testimonials and lived-in detail."] },
    ],
  },
  {
    slug: "complete-marketing-system-new-real-estate-development",
    category: "marketing",
    label: "Marketing & video",
    date: "April 28, 2026",
    read: "7 min read",
    title: "A Complete Marketing System for New Real Estate Developments",
    excerpt: "A launch works when brand, visuals, website and follow-up behave like one system instead of a collection of disconnected deliverables.",
    image: "/plantaz-building-cover.jpg",
    sections: [
      { heading: "Start with a clear market position", paragraphs: ["Before designing a logo or booking a campaign, define the project in one sentence. Who is it for? What is changing in the buyer’s life? Why this location, this product and this moment? A concise position makes every later decision faster, from naming and typography to the first paid ad."] },
      { heading: "Build the core asset system", paragraphs: ["The core system usually includes a visual identity, a CGI image library, a short video language, a responsive website and a lead capture flow. These pieces should share the same hierarchy: the same promise, proof points and next action. Consistency reduces friction and makes a project feel established before the first unit is sold."] },
      { heading: "Turn reach into useful conversations", paragraphs: ["Awareness is only the first job. Campaigns should separate people who are browsing from people who are ready to discuss a purchase. A focused landing page, a short registration form and a clear follow-up sequence give the sales team better information than a generic contact form."], bullets: ["Use short video and strong stills to earn the first click.", "Use the landing page to answer the questions that stop registration.", "Use qualification fields to give the sales team context.", "Review campaign and CRM data weekly, then refine the message."] },
    ],
  },
  {
    slug: "real-estate-website-that-converts",
    category: "websites",
    label: "Websites & leads",
    date: "April 21, 2026",
    read: "6 min read",
    title: "What Makes a Real Estate Website Convert?",
    excerpt: "A high-converting property website does not overwhelm visitors. It gives the right person the confidence to take the next step.",
    image: "/mywebsite-cover.webp",
    sections: [
      { heading: "Lead with the buyer’s decision", paragraphs: ["The first screen should state the project, the location and the reason to care. A beautiful image helps earn attention, but the headline must orient the visitor. Keep the first action visible: register, book a meeting, request the brochure or view available homes."] },
      { heading: "Make exploration feel effortless", paragraphs: ["Buyers need different levels of detail at different moments. Let them move from overview to proof: gallery, plans, features, neighbourhood, availability and FAQs. Use short sections, purposeful animation and persistent navigation so the site feels calm on a phone as well as a large screen."] },
      { heading: "Design the form as part of the experience", paragraphs: ["Long forms create hesitation. Ask only for information the sales team will actually use, then explain what happens after submission. A short confirmation message and a clear response time build more trust than another paragraph of marketing copy.", "Technical details matter too. Fast images, descriptive page titles, readable contrast, semantic headings and indexable text help both users and search engines."] },
      { heading: "Measure the questions, not just the clicks", paragraphs: ["Track which pages people reach before registering, which source brought them and where they abandon the form. Those signals reveal what buyers still need to understand. A BrotherStudio website is built to support the campaign and the sales conversation, not to sit apart from them."] },
    ],
  },
  {
    slug: "video-360-walkthroughs-buyers-imagine-property",
    category: "marketing",
    label: "Marketing & video",
    date: "April 14, 2026",
    read: "5 min read",
    title: "How Video and 360° Walkthroughs Help Buyers Imagine a Property",
    excerpt: "Motion answers questions that still images leave open: how a space flows, how light changes and what it might feel like to arrive home.",
    image: "/myreview-cover.webp",
    sections: [
      { heading: "Show the experience in the right order", paragraphs: ["A property film should follow a simple human journey. Start with context, move through the spaces that matter most and finish with the detail buyers will remember. This can be a real shoot, a CGI animation or a combination of both. The format changes; the storytelling principle stays the same."] },
      { heading: "Use 360° to reduce uncertainty", paragraphs: ["Interactive walkthroughs give visitors control over where they look. They are especially useful for pre-construction suites, amenity spaces and developments where travel time makes an in-person visit difficult. A buyer can return to the kitchen, compare views and share the experience with a partner."] },
      { heading: "Keep the action close", paragraphs: ["Video performs best when it is connected to a next step. Add a clear invitation beside the player: see plans, register for updates or book a call. On social, use a short cutdown that leads to the full project page rather than asking the viewer to search for it later.", "We plan the shot list, visual rhythm, captions and cutdowns around the audience, then connect the finished pieces to the project website and campaign. The result is a library that can work across launch, remarketing and sales follow-up."] },
    ],
  },
  {
    slug: "brotherstudio-process-concept-to-sale",
    category: "real-estate",
    label: "Real estate",
    date: "April 7, 2026",
    read: "6 min read",
    title: "From First Concept to Sale: The BrotherStudio Process",
    excerpt: "The best work is not a hand-off between specialists. It is a connected process with one clear commercial objective.",
    image: "/myexperience-lifestyle-street-sunset.webp",
    sections: [
      { heading: "01 — Position the project", paragraphs: ["We clarify the audience, promise, context and competitive edge. This becomes the foundation for the brand, the visual direction and the language used in every campaign."] },
      { heading: "02 — Make the product visible", paragraphs: ["We create the images, videos, plans and diagrams that let people understand the property before it is complete. Each asset has a job, from the hero image that earns attention to the detail shot that answers a buyer question."] },
      { heading: "03 — Build the conversion path", paragraphs: ["The website brings the story together. It organizes the information, performs on mobile, captures interest and gives the sales team a useful signal about each lead."] },
      { heading: "04 — Launch, learn and improve", paragraphs: ["Paid campaigns and content bring the right audience to the project. We watch what people respond to, improve the creative and refine the path to registration instead of treating launch as a one-time event."] },
      { heading: "05 — Support the sale", paragraphs: ["For teams that need it, BrotherStudio can extend into sales support and real estate brokerage services. That means the creative work stays close to the buyer conversation and the commercial objective stays visible throughout the project.", "One team, one strategy and a clear route from first impression to qualified conversation. That is the standard we bring to every BrotherStudio engagement."] },
    ],
  },
];

const filterLabels: Record<Locale, Record<Category, string>> = {
  en: { all: "All", "real-estate": "Real estate", visualization: "CGI & visualization", marketing: "Marketing & video", websites: "Websites & leads" },
  fr: { all: "Tout", "real-estate": "Immobilier", visualization: "CGI & visualisation", marketing: "Marketing & vidéo", websites: "Sites & prospects" },
};

export default function InsightsClient({ locale }: { locale: Locale }) {
  const [filter, setFilter] = useState<Category>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const labels = filterLabels[locale];
  const visibleArticles = useMemo(() => filter === "all" ? articles : articles.filter((article) => article.category === filter), [filter]);
  const activeArticle = articles.find((article) => article.slug === selected) ?? null;

  if (activeArticle) {
    return <ArticleReader article={activeArticle} locale={locale} onBack={() => setSelected(null)} />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIntro}><p className={styles.eyebrow}>BrotherStudio / Insights</p><h1>Ideas that move projects from concept to sale.</h1><div className={styles.rule} /></div>
        <div className={styles.heroCopy}><strong>Property marketing, made practical.</strong><p>Clear thinking for developers, brokers and property teams who want better visuals, stronger launches and more qualified conversations.</p></div>
      </section>
      <div className={styles.heroImage}><img src="/myexperience-hero-night.webp" alt="Architectural visualization of a contemporary home at dusk" /></div>
      <section className={styles.toolbar} aria-label="Filter insights"><div className={styles.filters}>{(Object.keys(labels) as Category[]).map((key) => <button key={key} type="button" className={`${styles.filter} ${filter === key ? styles.active : ""}`} onClick={() => setFilter(key)}>{labels[key]}</button>)}</div><span className={styles.count}>{visibleArticles.length} {visibleArticles.length === 1 ? "insight" : "insights"}</span></section>
      <section className={styles.grid} aria-live="polite">{visibleArticles.map((article, index) => <ArticleCard key={article.slug} article={article} featured={index === 0} onOpen={() => setSelected(article.slug)} />)}</section>
      <section className={styles.cta}><div><p className={styles.eyebrow}>Have a project in mind?</p><h2>Let’s give your next property a clearer path to market.</h2></div><Link href={`/${locale}/contact`} className={styles.ctaLink}>Start a conversation ↗</Link></section>
    </main>
  );
}

function ArticleCard({ article, featured, onOpen }: { article: Article; featured: boolean; onOpen: () => void }) {
  return <button type="button" className={`${styles.card} ${featured ? styles.featured : ""}`} onClick={onOpen}><span className={styles.cardMedia}><img src={article.image} alt="" loading="lazy" /></span><span className={styles.cardBody}><span className={styles.tag}>{article.label}</span><span className={styles.cardTitle}>{article.title}</span><span className={styles.excerpt}>{article.excerpt}</span><span className={styles.read}>{article.date} · {article.read}<b>↗</b></span></span></button>;
}

function ArticleReader({ article, locale, onBack }: { article: Article; locale: Locale; onBack: () => void }) {
  return <main className={`${styles.page} ${styles.reader}`}><button type="button" className={styles.back} onClick={onBack}>← Back to insights</button><div className={styles.readerHead}><div><p className={styles.eyebrow}>{article.label}</p><h1>{article.title}</h1></div><p className={styles.readerMeta}>{article.excerpt}<br /><br />{article.date} · {article.read}<br />By BrotherStudio</p></div><div className={styles.readerLayout}><article><div className={styles.articleImage}><img src={article.image} alt={article.title} /></div><div className={styles.articleBody}>{article.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}</div></article><aside className={styles.aside}><strong>About BrotherStudio</strong><p>Property marketing, CGI, websites, video and real estate sales support for projects that deserve a clearer route to market.</p><strong>Next step</strong><p><Link href={`/${locale}/contact`}>Tell us about your project ↗</Link></p><strong>Explore</strong><p><Link href={`/${locale}`}>View the portfolio ↗</Link></p></aside></div></main>;
}
