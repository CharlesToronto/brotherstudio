import { getMessages } from "@/content/messages";
import { site } from "@/content/site";
import { withLocalePath } from "@/lib/i18n";

export type AssistantLocale = "fr" | "en";

export type LocalizedText = {
  fr: string;
  en?: string;
};

export type AssistantQaItem = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  keywords: string[];
};

export type AssistantCategory = {
  id: string;
  title: LocalizedText;
  items: AssistantQaItem[];
};

type AssistantPriceMessage = ReturnType<typeof getMessages>["price"];

const RAW_ASSISTANT_CATEGORIES: AssistantCategory[] = [
  {
    id: "about",
    title: { fr: "A propos de Brother Studio", en: "About Brother Studio" },
    items: [
      {
        id: "about-who",
        question: { fr: "Qui est Brother Studio ?", en: "Who is Brother Studio?" },
        answer: {
          fr: "Brother Studio est un studio specialise en visualisation architecturale, rendus 3D photorealistes et solutions digitales pour l'immobilier.",
        },
        keywords: ["brother studio", "qui", "studio", "about", "company"],
      },
      {
        id: "about-founder",
        question: {
          fr: "Qui est derriere l'entreprise ?",
          en: "Who is behind the company?",
        },
        answer: {
          fr: "Brother Studio est dirige par Charles, dessinateur en architecture diplome (CFC Suisse), specialise en visualisation 3D.",
        },
        keywords: ["charles", "founder", "fondateur", "entreprise"],
      },
      {
        id: "about-experience",
        question: { fr: "Quelle est votre experience ?", en: "What is your experience?" },
        answer: {
          fr: "Nous realisons des projets residentiels et commerciaux : villas, immeubles, chalets et developpements immobiliers.",
        },
        keywords: ["experience", "residentiel", "commercial", "projects"],
      },
      {
        id: "about-why",
        question: {
          fr: "Pourquoi choisir Brother Studio ?",
          en: "Why choose Brother Studio?",
        },
        answer: {
          fr: "Pour notre realisme, notre respect des plans, nos delais rapides et nos tarifs competitifs.",
        },
        keywords: ["pourquoi", "why", "choose", "difference"],
      },
      {
        id: "about-difference",
        question: {
          fr: "Qu'est-ce qui vous differencie des autres ?",
          en: "What makes you different?",
        },
        answer: {
          fr: "Notre expertise en architecture, nos rendus haut de gamme et notre plateforme de revision en ligne.",
        },
        keywords: ["differencie", "different", "expertise", "revision"],
      },
      {
        id: "about-location",
        question: { fr: "Ou etes-vous bases ?", en: "Where are you based?" },
        answer: { fr: "Nous sommes bases a Toronto (Canada) et a Monthey (Suisse)." },
        keywords: ["ou", "where", "toronto", "monthey", "suisse", "canada"],
      },
      {
        id: "about-international",
        question: {
          fr: "Travaillez-vous a l'international ?",
          en: "Do you work internationally?",
        },
        answer: { fr: "Oui, nous travaillons avec des clients partout dans le monde." },
        keywords: ["international", "worldwide", "monde"],
      },
      {
        id: "about-clients",
        question: {
          fr: "Avec quels types de clients travaillez-vous ?",
          en: "What types of clients do you work with?",
        },
        answer: {
          fr: "Architectes, promoteurs, constructeurs, designers d'interieur et particuliers.",
        },
        keywords: ["clients", "architectes", "promoteurs", "designers", "particuliers"],
      },
    ],
  },
  {
    id: "services",
    title: { fr: "Services", en: "Services" },
    items: [
      {
        id: "services-offer",
        question: { fr: "Quels services proposez-vous ?", en: "What services do you offer?" },
        answer: {
          fr: "Rendus 3D, animations, visites virtuelles, design d'interieur et creation de sites web. Consultez notre page Services pour plus de details.",
        },
        keywords: ["services", "offer", "proposez"],
      },
      {
        id: "services-renderings",
        question: {
          fr: "Realisez-vous des rendus 3D photorealistes ?",
          en: "Do you create photorealistic 3D renderings?",
        },
        answer: { fr: "Oui, tous nos rendus sont concus pour le marketing immobilier." },
        keywords: ["rendus", "renderings", "3d", "photorrealistes"],
      },
      {
        id: "services-video",
        question: {
          fr: "Creez-vous des animations et videos 3D ?",
          en: "Do you create 3D animations and videos?",
        },
        answer: { fr: "Oui, nous realisons des videos immersives pour presenter vos projets." },
        keywords: ["video", "animation", "walkthrough", "immersive"],
      },
      {
        id: "services-virtual-tour",
        question: {
          fr: "Proposez-vous des visites virtuelles ?",
          en: "Do you offer virtual tours?",
        },
        answer: { fr: "Oui, nous creons des visites interactives de vos projets." },
        keywords: ["visites virtuelles", "virtual tours", "interactive"],
      },
      {
        id: "services-interior",
        question: {
          fr: "Faites-vous du design d'interieur ?",
          en: "Do you provide interior design?",
        },
        answer: { fr: "Oui, pour les projets residentiels et commerciaux." },
        keywords: ["design interieur", "interior design"],
      },
      {
        id: "services-websites",
        question: {
          fr: "Concevez-vous des sites web immobiliers ?",
          en: "Do you build real estate websites?",
        },
        answer: {
          fr: "Oui, des sites modernes optimises pour presenter et vendre vos projets.",
        },
        keywords: ["site web", "website", "immobilier", "real estate"],
      },
      {
        id: "services-chatbot",
        question: {
          fr: "Integrez-vous des chatbots IA sur les sites web ?",
          en: "Do you integrate AI chatbots on websites?",
        },
        answer: { fr: "Oui, nous developpons des assistants IA personnalises pour votre site." },
        keywords: ["chatbot", "ia", "ai", "assistant"],
      },
      {
        id: "services-staging",
        question: {
          fr: "Proposez-vous des services de home staging virtuel ?",
          en: "Do you offer virtual home staging?",
        },
        answer: { fr: "Oui, nous amenageons virtuellement vos espaces." },
        keywords: ["home staging", "virtual staging"],
      },
      {
        id: "services-retouch",
        question: {
          fr: "Pouvez-vous ameliorer ou retoucher des images existantes ?",
          en: "Can you improve or retouch existing images?",
        },
        answer: { fr: "Oui, nous ameliorons ou transformons vos images existantes." },
        keywords: ["retouche", "retouch", "images existantes", "ameliorer"],
      },
    ],
  },
  {
    id: "portfolio",
    title: { fr: "Portfolio", en: "Portfolio" },
    items: [
      {
        id: "portfolio-see",
        question: { fr: "Puis-je voir vos realisations ?", en: "Can I see your work?" },
        answer: { fr: "Oui, notre portfolio est disponible sur notre site." },
        keywords: ["portfolio", "realisations", "see your work"],
      },
      {
        id: "portfolio-similar",
        question: {
          fr: "Avez-vous deja realise un projet similaire au mien ?",
          en: "Have you done a project similar to mine?",
        },
        answer: { fr: "Tres probablement. Nous avons realise une grande variete de projets." },
        keywords: ["similaire", "similar", "project"],
      },
      {
        id: "portfolio-sectors",
        question: {
          fr: "Dans quels secteurs travaillez-vous ?",
          en: "Which sectors do you work in?",
        },
        answer: { fr: "Residentiel, commercial, immobilier et design interieur." },
        keywords: ["secteurs", "sectors", "residentiel", "commercial", "interieur"],
      },
      {
        id: "portfolio-authentic",
        question: {
          fr: "Vos images sont-elles reellement issues de vos projets ?",
          en: "Are your images really from your projects?",
        },
        answer: { fr: "Oui, toutes nos realisations sont authentiques." },
        keywords: ["authentiques", "authentic", "images", "projets"],
      },
    ],
  },
  {
    id: "process",
    title: { fr: "Processus", en: "Process" },
    items: [
      {
        id: "process-flow",
        question: { fr: "Comment se deroule un projet ?", en: "How does a project work?" },
        answer: {
          fr: "Vous nous envoyez vos plans, nous realisons les visuels puis vous les validez sur notre plateforme MyReview™.",
        },
        keywords: ["comment", "processus", "myreview", "project"],
      },
      {
        id: "process-files",
        question: { fr: "Quels fichiers dois-je fournir ?", en: "Which files should I provide?" },
        answer: { fr: "PDF, DWG ou SketchUp." },
        keywords: ["fichiers", "pdf", "dwg", "sketchup", "files"],
      },
      {
        id: "process-duration",
        question: { fr: "Combien de temps prend un projet ?", en: "How long does a project take?" },
        answer: { fr: "En moyenne, comptez environ 1 jour par image." },
        keywords: ["combien de temps", "how long", "1 jour par image"],
      },
      {
        id: "process-follow",
        question: { fr: "Puis-je suivre l'avancement ?", en: "Can I follow the progress?" },
        answer: { fr: "Oui, grace a notre plateforme MyReview™." },
        keywords: ["avancement", "progress", "suivre", "myreview"],
      },
      {
        id: "process-revisions",
        question: { fr: "Combien de revisions sont incluses ?", en: "How many revisions are included?" },
        answer: { fr: "En general, 3 series de modifications sont incluses." },
        keywords: ["revisions", "modifications", "incluses", "included"],
      },
    ],
  },
  {
    id: "quality",
    title: { fr: "Qualite", en: "Quality" },
    items: [
      {
        id: "quality-resolution",
        question: { fr: "Quelle est la resolution des images ?", en: "What image resolution do you deliver?" },
        answer: {
          fr: "Nous livrons des images en haute resolution, pretes pour le web et l'impression.",
        },
        keywords: ["resolution", "haute resolution", "print", "web"],
      },
      {
        id: "quality-proportions",
        question: {
          fr: "Les proportions du projet sont-elles respectees ?",
          en: "Are project proportions respected?",
        },
        answer: { fr: "Oui, nous respectons fidelement vos plans." },
        keywords: ["proportions", "plans", "respectees", "accurate"],
      },
      {
        id: "quality-materials",
        question: {
          fr: "Les materiaux et la lumiere sont-ils personnalisables ?",
          en: "Can materials and lighting be customized?",
        },
        answer: { fr: "Oui, chaque rendu est entierement personnalise." },
        keywords: ["materiaux", "lumiere", "custom", "lighting", "materials"],
      },
      {
        id: "quality-variants",
        question: {
          fr: "Pouvez-vous produire des rendus de jour, de nuit ou selon differentes saisons ?",
          en: "Can you create day, night, or seasonal renderings?",
        },
        answer: { fr: "Oui." },
        keywords: ["jour", "nuit", "saisons", "day", "night", "season"],
      },
      {
        id: "quality-sales",
        question: {
          fr: "Les images peuvent-elles etre utilisees pour le marketing et la vente ?",
          en: "Can the images be used for marketing and sales?",
        },
        answer: { fr: "Oui, elles sont concues pour la commercialisation." },
        keywords: ["marketing", "vente", "sales", "commercialisation"],
      },
    ],
  },
  {
    id: "pricing",
    title: { fr: "Tarifs", en: "Pricing" },
    items: [
      {
        id: "pricing-render",
        question: { fr: "Combien coute un rendu 3D ?", en: "How much does a 3D rendering cost?" },
        answer: {
          fr: "Les prix commencent a partir de 650 CHF par image. Consultez notre page Tarifs pour plus d'informations.",
        },
        keywords: ["cout", "cost", "650", "tarifs", "prix"],
      },
      {
        id: "pricing-quote",
        question: { fr: "Proposez-vous un devis gratuit ?", en: "Do you offer a free quote?" },
        answer: { fr: "Oui, tous nos devis sont gratuits." },
        keywords: ["devis", "quote", "gratuit", "free"],
      },
      {
        id: "pricing-changes",
        question: {
          fr: "Les modifications sont-elles incluses dans le prix ?",
          en: "Are revisions included in the price?",
        },
        answer: { fr: "Oui, les revisions prevues dans le devis sont incluses." },
        keywords: ["modifications", "revisions", "included", "price"],
      },
      {
        id: "pricing-packages",
        question: {
          fr: "Offrez-vous des forfaits pour plusieurs images ou projets ?",
          en: "Do you offer packages for multiple images or projects?",
        },
        answer: { fr: "Oui." },
        keywords: ["forfaits", "packages", "plusieurs images", "multiple"],
      },
    ],
  },
  {
    id: "timing",
    title: { fr: "Delais", en: "Timing" },
    items: [
      {
        id: "timing-usual",
        question: { fr: "Quels sont vos delais habituels ?", en: "What are your usual timelines?" },
        answer: { fr: "En moyenne, comptez environ 1 jour par image." },
        keywords: ["delais", "timelines", "habituels", "usual"],
      },
    ],
  },
  {
    id: "payment",
    title: { fr: "Paiement", en: "Payment" },
    items: [
      {
        id: "payment-methods",
        question: {
          fr: "Quels moyens de paiement acceptez-vous ?",
          en: "What payment methods do you accept?",
        },
        answer: { fr: "Virement bancaire, Interac e-Transfer et Wise." },
        keywords: ["paiement", "payment", "interac", "wise", "virement"],
      },
      {
        id: "payment-deposit",
        question: { fr: "Demandez-vous un acompte ?", en: "Do you require a deposit?" },
        answer: { fr: "Non. Seule la signature du contrat est demandee." },
        keywords: ["acompte", "deposit", "contrat"],
      },
      {
        id: "payment-when",
        question: { fr: "A quel moment le paiement est-il effectue ?", en: "When is payment made?" },
        answer: { fr: "Apres la livraison des fichiers finaux." },
        keywords: ["quand", "when", "paiement", "livraison"],
      },
      {
        id: "payment-invoice",
        question: { fr: "Fournissez-vous une facture ?", en: "Do you provide an invoice?" },
        answer: { fr: "Oui." },
        keywords: ["facture", "invoice"],
      },
    ],
  },
  {
    id: "delivery",
    title: { fr: "Livraison", en: "Delivery" },
    items: [
      {
        id: "delivery-formats",
        question: { fr: "Quels formats de fichiers recevrons-nous ?", en: "Which file formats will we receive?" },
        answer: { fr: "JPG, PNG, PDF, MP4 et autres formats selon vos besoins." },
        keywords: ["formats", "jpg", "png", "pdf", "mp4"],
      },
      {
        id: "delivery-ready",
        question: {
          fr: "Les fichiers sont-ils prets pour l'impression et le web ?",
          en: "Are the files ready for print and web?",
        },
        answer: { fr: "Oui." },
        keywords: ["impression", "web", "prets", "ready"],
      },
      {
        id: "delivery-source",
        question: { fr: "Les fichiers sources sont-ils inclus ?", en: "Are source files included?" },
        answer: { fr: "Non, sauf indication contraire dans le devis." },
        keywords: ["fichiers sources", "source files", "inclus"],
      },
      {
        id: "delivery-archive",
        question: {
          fr: "Conservez-vous les projets apres la livraison ?",
          en: "Do you keep projects after delivery?",
        },
        answer: { fr: "Oui." },
        keywords: ["conservez", "archive", "after delivery"],
      },
    ],
  },
  {
    id: "confidentiality",
    title: { fr: "Confidentialite", en: "Confidentiality" },
    items: [
      {
        id: "confidentiality-docs",
        question: { fr: "Mes documents sont-ils confidentiels ?", en: "Are my documents confidential?" },
        answer: { fr: "Oui." },
        keywords: ["confidentiels", "confidential", "documents"],
      },
      {
        id: "confidentiality-nda",
        question: { fr: "Signez-vous des accords de confidentialite (NDA) ?", en: "Do you sign NDAs?" },
        answer: { fr: "Oui, sur demande." },
        keywords: ["nda", "confidentialite", "accords"],
      },
      {
        id: "confidentiality-portfolio",
        question: {
          fr: "Mon projet sera-t-il publie sur votre portfolio ?",
          en: "Will my project be published on your portfolio?",
        },
        answer: { fr: "Oui, sauf demande contraire de votre part." },
        keywords: ["portfolio", "publie", "publish"],
      },
    ],
  },
  {
    id: "collaboration",
    title: { fr: "Collaboration", en: "Collaboration" },
    items: [
      {
        id: "collaboration-architects",
        question: { fr: "Travaillez-vous avec des architectes ?", en: "Do you work with architects?" },
        answer: { fr: "Oui." },
        keywords: ["architectes", "architects"],
      },
      {
        id: "collaboration-developers",
        question: {
          fr: "Travaillez-vous avec des promoteurs immobiliers ?",
          en: "Do you work with real estate developers?",
        },
        answer: { fr: "Oui." },
        keywords: ["promoteurs", "developers", "immobiliers"],
      },
      {
        id: "collaboration-private",
        question: {
          fr: "Acceptez-vous les projets de particuliers ?",
          en: "Do you accept private client projects?",
        },
        answer: { fr: "Oui." },
        keywords: ["particuliers", "private"],
      },
      {
        id: "collaboration-team",
        question: { fr: "Pouvez-vous collaborer avec notre equipe ?", en: "Can you collaborate with our team?" },
        answer: { fr: "Oui." },
        keywords: ["equipe", "team", "collaborer"],
      },
    ],
  },
  {
    id: "contact",
    title: { fr: "Contact", en: "Contact" },
    items: [
      {
        id: "contact-quote",
        question: { fr: "Comment obtenir un devis ?", en: "How can I get a quote?" },
        answer: { fr: "Envoyez-nous vos plans via le formulaire de contact." },
        keywords: ["devis", "quote", "formulaire", "contact"],
      },
      {
        id: "contact-elements",
        question: { fr: "Quels elements dois-je vous envoyer ?", en: "What should I send you?" },
        answer: { fr: "Vos plans, croquis et references." },
        keywords: ["elements", "envoyer", "plans", "croquis", "references"],
      },
      {
        id: "contact-best",
        question: { fr: "Quel est le meilleur moyen de vous contacter ?", en: "What is the best way to contact you?" },
        answer: {
          fr: `Le plus simple est via le formulaire de contact ou par email a ${site.contact.email}.`,
        },
        keywords: ["meilleur moyen", "best way", "contact", "email"],
      },
    ],
  },
];

function pickAssistantItems(...categoryIds: string[]) {
  return RAW_ASSISTANT_CATEGORIES.flatMap((category) =>
    categoryIds.includes(category.id) ? category.items : [],
  );
}

export const ASSISTANT_CATEGORIES: AssistantCategory[] = [
  {
    id: "studio",
    title: { fr: "Studio", en: "Studio" },
    items: pickAssistantItems("about", "portfolio", "collaboration"),
  },
  {
    id: "services",
    title: { fr: "Services", en: "Services" },
    items: pickAssistantItems("services", "quality"),
  },
  {
    id: "project",
    title: { fr: "Projet", en: "Project" },
    items: pickAssistantItems("process", "timing", "delivery"),
  },
  {
    id: "pricing",
    title: { fr: "Tarifs", en: "Pricing" },
    items: pickAssistantItems("pricing", "payment"),
  },
  {
    id: "contact",
    title: { fr: "Contact", en: "Contact" },
    items: pickAssistantItems("contact", "confidentiality"),
  },
];

export function normalizeAssistantText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function readAssistantText(text: LocalizedText, locale: AssistantLocale) {
  return locale === "fr" ? text.fr : text.en ?? text.fr;
}

function getAssistantPriceMessages(locale: AssistantLocale): AssistantPriceMessage {
  return getMessages(locale).price;
}

function buildPriceRow(name: string, price: string) {
  return `- ${name}: ${price}`;
}

function buildOptionRows(
  options: Array<{ name: string; price: string }> | undefined,
  locale: AssistantLocale,
) {
  if (!options?.length) return "";

  return options
    .map((option) =>
      locale === "fr"
        ? `  - ${option.name}: ${option.price}`
        : `  - ${option.name}: ${option.price}`,
    )
    .join("\n");
}

function buildPricingKnowledgeContext(locale: AssistantLocale) {
  const price = getAssistantPriceMessages(locale);
  const pricePath = withLocalePath(locale, "/price");
  const contactPath = withLocalePath(locale, "/contact");
  const intro =
    locale === "fr"
      ? [
          "Orientation tarifaire:",
          "- Pour une question de prix, repondre simplement et donner le prix exact si disponible.",
          `- Proposer aussi la page tarifs: ${pricePath}.`,
          "- Preciser en une ligne que certaines reductions ou gains de cout peuvent s'appliquer selon les fichiers fournis et le niveau de preparation du dossier.",
          "- Si le detail d'un ajustement n'est pas explicitement liste, dire qu'il est a confirmer selon les fichiers recus.",
          "- Si utile, proposer d'expliquer le calcul dans le chat ou d'envoyer vers la page contact.",
        ]
      : [
          "Pricing guidance:",
          "- For pricing questions, answer simply and give the exact price when available.",
          `- Also suggest the pricing page: ${pricePath}.`,
          "- Mention in one line that some cost reductions or efficiency gains may apply depending on the files provided and the level of preparation.",
          "- If an adjustment is not explicitly listed, say it must be confirmed after reviewing the files.",
          "- When useful, offer to explain the estimate in the chat or direct the visitor to the contact page.",
        ];

  const sections = [
    intro.join("\n"),
    `${locale === "fr" ? "Page tarifs" : "Pricing page"}: ${pricePath}`,
    `${locale === "fr" ? "Page contact" : "Contact page"}: ${contactPath}`,
    `## ${price.imagesTitle}\n${price.images.map((item) => buildPriceRow(item.name, item.price)).join("\n")}\n${
      locale === "fr"
        ? `Note: ${price.imageNote}`
        : `Note: ${price.imageNote}`
    }`,
    `## ${price.videosTitle}\n${price.videos
      .map((video) => {
        const header = buildPriceRow(
          video.name,
          video.price ?? (locale === "fr" ? "Voir options" : "See options"),
        );
        const options = buildOptionRows(video.options, locale);
        return options ? `${header}\n${options}` : header;
      })
      .join("\n")}`,
    `## ${price.websiteTitle}\n${price.websites
      .map((item) => buildPriceRow(item.name, item.price))
      .join("\n")}`,
    `## ${price.adsTitle}\n${price.ads
      .map((item) => {
        const header = buildPriceRow(
          item.name,
          item.price ?? (locale === "fr" ? "Voir options" : "See options"),
        );
        const options = buildOptionRows(
          item.options?.filter(
            (option): option is { name: string; price: string } => typeof option.price === "string",
          ),
          locale,
        );
        const optionNames = item.options?.length
          ? `\n${item.options.map((option) => `  - ${option.name}`).join("\n")}`
          : "";
        return options ? `${header}\n${options}` : `${header}${optionNames}`;
      })
      .join("\n")}`,
    `## ${price.packagesTitle}\n${price.packages
      .map((item) => {
        const summary = item.summary
          ? locale === "fr"
            ? `\n  - Sous-titre: ${item.summary}`
            : `\n  - Subtitle: ${item.summary}`
          : "";
        const sectionLines = item.sections?.length
          ? item.sections
              .map(
                (section) =>
                  `  - ${section.title}\n${section.items.map((detail) => `    - ${detail}`).join("\n")}`,
              )
              .join("\n")
          : "";
        const included = item.included?.length
          ? `\n  - ${price.packageIncludedLabel}\n${item.included
              .map((detail) => `    - ${detail}`)
              .join("\n")}`
          : "";
        const delivery = item.delivery?.length
          ? `\n  - ${price.packageDeliveryLabel}\n${item.delivery
              .map((detail) => `    - ${detail}`)
              .join("\n")}`
          : "";
        const compare = item.comparePrice
          ? locale === "fr"
            ? `\n  - Valeur standard: ${item.comparePrice}`
            : `\n  - Standard value: ${item.comparePrice}`
          : "";
        const note = item.note ? `\n  - Note: ${item.note}` : "";
        return `${buildPriceRow(item.name, item.price)}${summary}${compare}${sectionLines ? `\n${sectionLines}` : ""}${included}${delivery}${note}`;
      })
      .join("\n")}`,
    `## ${price.includedTitle}\n${getMessages(locale).services.pricingIncludes
      .map((item) => `- ${item}`)
      .join("\n")}`,
    `## ${price.partnershipTitle}\n${price.partnerships
      .map((item) => `- ${item}`)
      .join("\n")}\n${price.partnershipNote}`,
    `## ${price.workflowTitle}\n- ${price.workflowIncludesLabel} ${price.workflowLinkLabel}\n- ${price.workflowComingSoon}`,
    locale === "fr"
      ? "## Remarque commerciale\n- Des reductions ou gains de cout peuvent s'appliquer selon les fichiers fournis (PDF, DWG, SketchUp, niveau de preparation du dossier). Si besoin, renvoyer vers la page tarifs ou proposer d'expliquer le calcul dans le chat."
      : "## Commercial note\n- Some cost reductions or efficiency gains may apply depending on the files provided (PDF, DWG, SketchUp, level of preparation). When useful, direct the visitor to the pricing page or offer to explain the estimate in the chat.",
  ];

  return sections.join("\n\n");
}

function buildPricingFallbackReply(input: string, locale: AssistantLocale) {
  const normalizedInput = normalizeAssistantText(input);
  const price = getAssistantPriceMessages(locale);
  const pricePath = withLocalePath(locale, "/price");
  const reductionLine =
    locale === "fr"
      ? "Des reductions ou gains de cout peuvent s'appliquer selon les fichiers fournis."
      : "Some cost reductions or efficiency gains may apply depending on the files provided.";
  const closingLine =
    locale === "fr"
      ? `Liste complete: ${pricePath}. Je peux aussi vous detailler le calcul ici dans le chat.`
      : `Full list: ${pricePath}. I can also break down the estimate here in the chat.`;

  const isWebsite = /website|site web|site de vente|web/.test(normalizedInput);
  const isVideo = /video|walkthrough|drone/.test(normalizedInput);
  const isPackage = /package|forfait|pack/.test(normalizedInput);
  const isImage = /image|render|rendu|plan|floorplan|drone view/.test(normalizedInput);
  const isAds = /meta ads|ads|publicite|publicite meta|lead generation|facebook|instagram/.test(
    normalizedInput,
  );
  const isPricing = isAssistantPricingQuestion(input);
  const mentionedPackage = price.packages.find((item) =>
    normalizedInput.includes(normalizeAssistantText(item.name)),
  );

  if (!isPricing && !isWebsite && !isVideo && !isPackage && !isImage && !isAds && !mentionedPackage) {
    return null;
  }

  if (mentionedPackage) {
    const sectionLines = mentionedPackage.sections?.length
      ? mentionedPackage.sections
          .map((section) => {
            const details = section.items
              .filter((detail) => detail.trim() !== "-")
              .map((detail) => `  - ${detail}`)
              .join("\n");
            return details ? `- ${section.title}\n${details}` : `- ${section.title}`;
          })
          .join("\n")
      : "";
    const includedLines = mentionedPackage.included?.length
      ? mentionedPackage.included
          .filter((detail) => detail.trim() !== "-")
          .map((detail) => `  - ${detail}`)
          .join("\n")
      : "";
    const deliveryLines = mentionedPackage.delivery?.length
      ? mentionedPackage.delivery.map((detail) => `  - ${detail}`).join("\n")
      : "";

    return [
      locale === "fr"
        ? `Voici le detail actuel de ${mentionedPackage.name}:`
        : `Here is the current breakdown for ${mentionedPackage.name}:`,
      buildPriceRow(mentionedPackage.name, mentionedPackage.price),
      mentionedPackage.summary
        ? locale === "fr"
          ? `- Sous-titre: ${mentionedPackage.summary}`
          : `- Subtitle: ${mentionedPackage.summary}`
        : null,
      includedLines
        ? `${locale === "fr" ? `- ${price.packageIncludedLabel}` : `- ${price.packageIncludedLabel}`}\n${includedLines}`
        : null,
      sectionLines,
      deliveryLines
        ? `${locale === "fr" ? `- ${price.packageDeliveryLabel}` : `- ${price.packageDeliveryLabel}`}\n${deliveryLines}`
        : null,
      closingLine,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (isWebsite) {
    return [
      locale === "fr"
        ? "Voici les tarifs website les plus utiles:"
        : "Here are the most relevant website prices:",
      ...price.websites.map((item) => buildPriceRow(item.name, item.price)),
      reductionLine,
      closingLine,
    ].join("\n");
  }

  if (isVideo) {
    return [
      locale === "fr"
        ? "Voici les principaux tarifs video:"
        : "Here are the main video prices:",
      ...price.videos.flatMap((item) =>
        item.options?.length
          ? [buildPriceRow(item.name, locale === "fr" ? "Voir options" : "See options")].concat(
              item.options.map((option) => `  - ${option.name}: ${option.price}`),
            )
          : [buildPriceRow(item.name, item.price ?? "")],
      ),
      reductionLine,
      closingLine,
    ].join("\n");
  }

  if (isAds) {
    return [
      locale === "fr"
        ? "Voici les principaux details Meta Ads Lead Generation:"
        : "Here are the main Meta Ads Lead Generation details:",
      ...price.ads.flatMap((item) => {
        const rows = [buildPriceRow(item.name, item.price ?? "")];
        if (item.options?.length) {
          rows.push(...item.options.map((option) => `  - ${option.name}${option.price ? `: ${option.price}` : ""}`));
        }
        return rows;
      }),
      reductionLine,
      closingLine,
    ].join("\n");
  }

  if (isPackage) {
    return [
      locale === "fr"
        ? "Voici nos forfaits actuels:"
        : "Here are our current packages:",
      ...price.packages.map((item) => buildPriceRow(item.name, item.price)),
      reductionLine,
      closingLine,
    ].join("\n");
  }

  if (isImage) {
    return [
      locale === "fr"
        ? "Voici les principaux tarifs image:"
        : "Here are the main image prices:",
      ...price.images.map((item) => buildPriceRow(item.name, item.price)),
      reductionLine,
      closingLine,
    ].join("\n");
  }

  return [
    locale === "fr"
      ? "Voici le resume tarifaire le plus utile:"
      : "Here is the most useful pricing summary:",
    ...price.images.slice(0, 3).map((item) => buildPriceRow(item.name, item.price)),
    ...price.websites.map((item) => buildPriceRow(item.name, item.price)),
    ...price.packages.map((item) => buildPriceRow(item.name, item.price)),
    reductionLine,
    closingLine,
  ].join("\n");
}

export function isAssistantPricingQuestion(input: string) {
  const normalizedInput = normalizeAssistantText(input);
  return /prix|price|tarif|cost|cout|combien|quote|devis|budget|combien ca coute|how much/.test(
    normalizedInput,
  );
}

export function buildAssistantPricingPostscript(locale: AssistantLocale) {
  const price = getAssistantPriceMessages(locale);
  const pricePath = withLocalePath(locale, "/price");
  const packageSummary =
    locale === "fr"
      ? `Forfaits: ${price.packages
          .map((item) => `${item.name} ${item.price}`)
          .join(" · ")}.`
      : `Packages: ${price.packages
          .map((item) => `${item.name} ${item.price}`)
          .join(" · ")}.`;
  const pageSummary =
    locale === "fr"
      ? `Liste complete: ${pricePath}.`
      : `Full list: ${pricePath}.`;

  return `${packageSummary} ${pageSummary}`;
}

export function findAssistantQaMatch(input: string, locale: AssistantLocale) {
  const normalizedInput = normalizeAssistantText(input);
  const allItems = ASSISTANT_CATEGORIES.flatMap((category) => category.items);

  return allItems.find((entry) => {
    const questionMatch = normalizeAssistantText(
      readAssistantText(entry.question, locale),
    ).includes(normalizedInput);

    const keywordMatch = entry.keywords.some((keyword) =>
      normalizedInput.includes(normalizeAssistantText(keyword)),
    );

    return questionMatch || keywordMatch;
  });
}

export function buildAssistantLocalReply(input: string, locale: AssistantLocale) {
  const pricingReply = buildPricingFallbackReply(input, locale);
  if (pricingReply) return pricingReply;

  const match = findAssistantQaMatch(input, locale);
  return match ? readAssistantText(match.answer, locale) : null;
}

export function buildAssistantKnowledgeContext(locale: AssistantLocale) {
  const faqContext = ASSISTANT_CATEGORIES.map((category) => {
    const title = readAssistantText(category.title, locale);
    const items = category.items
      .map((item) => {
        const question = readAssistantText(item.question, locale);
        const answer = readAssistantText(item.answer, locale);
        return `Q: ${question}\nR: ${answer}`;
      })
      .join("\n\n");

    return `## ${title}\n${items}`;
  }).join("\n\n");

  return `${faqContext}\n\n${buildPricingKnowledgeContext(locale)}`;
}
