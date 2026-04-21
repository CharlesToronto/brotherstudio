import type { Locale } from "@/lib/i18n";

export type QuickPromptTemplate = {
  id: string;
  label: string;
  text: string;
};

export type ContactFormMessages = {
  labels: {
    name: string;
    email: string;
    phoneOptional: string;
    quickPrompt: string;
    message: string;
  };
  buttons: {
    send: string;
    sending: string;
  };
  status: {
    success: string;
    genericError: string;
    chooseQuickPrompt: string;
  };
  promptGroupAriaLabel: string;
  messagePlaceholder: string;
  quickPrompts: QuickPromptTemplate[];
};

export type SiteMessages = {
  header: {
    nav: {
      gallery: string;
      instagram: string;
      services: string;
      price: string;
      about: string;
      contact: string;
    };
    localeSwitcherLabel: string;
    localeLabels: Record<Locale, string>;
    themeLabels: {
      light: string;
      dark: string;
    };
  };
  home: {
    metadataTitle: string;
    metadataDescription: string;
    introLine: string;
    backToTopLabel: string;
    backToFooterLabel: string;
    projectFilterAllLabel: string;
    projectFilterAriaLabel: string;
  };
  services: {
    title: string;
    metadataDescription: string;
    openGraphDescription: string;
    intro: string;
    includedTitle: string;
    services: string[];
    pricingIncludes: string[];
    ctaText: string;
    ctaLinkLabel: string;
  };
  price: {
    title: string;
    metadataDescription: string;
    openGraphDescription: string;
    intro: string;
    accessTitle: string;
    accessText: string;
    accessPlaceholder: string;
    accessButton: string;
    accessLegal: string;
    invalidEmail: string;
    imagesTitle: string;
    videosTitle: string;
    packagesTitle: string;
    partnershipTitle: string;
    workflowTitle: string;
    includedTitle: string;
    imageNote: string;
    images: Array<{
      name: string;
      price: string;
    }>;
    videos: Array<{
      name: string;
      price?: string;
      options?: Array<{
        name: string;
        price: string;
      }>;
    }>;
    packages: Array<{
      name: string;
      price: string;
      details?: string[];
    }>;
    partnerships: string[];
    workflowIncludesLabel: string;
    workflowLinkLabel: string;
    workflowComingSoon: string;
    ctaText: string;
    ctaLinkLabel: string;
  };
  about: {
    title: string;
    location: string;
    metadataDescription: string;
    biographyTitle: string;
    biographyButtons: {
      expand: string;
      collapse: string;
    };
    intro: string;
    paragraphs: string[];
    highlightsTitle: string;
    highlights: string[];
    portraitAlt: string;
    portraitCaption: string;
    connectTitle: string;
    connectText: string;
    emailLabel: string;
    instagramLabel: string;
    ctaText: string;
    ctaLinkLabel: string;
  };
  contact: {
    title: string;
    detailsTitle: string;
    metadataDescription: string;
    form: ContactFormMessages;
  };
};

const englishQuickPrompts: QuickPromptTemplate[] = [
  {
    id: "images",
    label: "Images",
    text: `Hello BrotherStudio,

I would like a quote for photorealistic 3D images.

Project type:
Location:
Interior / Exterior / Landscape:
Number of images needed:
Deadline:
Plans / PDF available:

Additional details:`,
  },
  {
    id: "images-video",
    label: "Images + Video",
    text: `Hello BrotherStudio,

I would like a quote for both photorealistic 3D images and video.

Project type:
Location:
Interior / Exterior / Landscape:
Number of images needed:
Video type (walkthrough / marketing / drone view):
Approximate video duration:
Deadline:
Plans / PDF / model available:

Additional details:`,
  },
  {
    id: "video",
    label: "Video",
    text: `Hello BrotherStudio,

I need a video (walkthrough / marketing / drone view).

Project type:
Video type:
Approximate duration:
Deadline:
Plans / PDF / model available:

Additional details:`,
  },
  {
    id: "neutral",
    label: "Neutral",
    text: "",
  },
];

const frenchQuickPrompts: QuickPromptTemplate[] = [
  {
    id: "images",
    label: "Images",
    text: `Bonjour BrotherStudio,

Je souhaite un devis pour des images 3D photorealistes.

Type de projet :
Lieu :
Interieur / Exterieur / Paysage :
Nombre d'images :
Deadline :
Plans / PDF disponibles :

Details supplementaires :`,
  },
  {
    id: "images-video",
    label: "Images + Video",
    text: `Bonjour BrotherStudio,

Je souhaite un devis pour des images 3D photorealistes et une video.

Type de projet :
Lieu :
Interieur / Exterieur / Paysage :
Nombre d'images :
Type de video (walkthrough / marketing / drone view) :
Duree approximative :
Deadline :
Plans / PDF / modele disponible :

Details supplementaires :`,
  },
  {
    id: "video",
    label: "Video",
    text: `Bonjour BrotherStudio,

Je souhaite une video (walkthrough / marketing / drone view).

Type de projet :
Type de video :
Duree approximative :
Deadline :
Plans / PDF / modele disponible :

Details supplementaires :`,
  },
  {
    id: "neutral",
    label: "Neutral",
    text: "",
  },
];

export const messagesByLocale: Record<Locale, SiteMessages> = {
  en: {
    header: {
      nav: {
        gallery: "Gallery",
        instagram: "Instagram",
        services: "Services",
        price: "Price",
        about: "About",
        contact: "Contact",
      },
      localeSwitcherLabel: "Language",
      localeLabels: { en: "EN", fr: "FR" },
      themeLabels: {
        light: "WHITE",
        dark: "BLACK",
      },
    },
    home: {
      metadataTitle: "Rendus 3D architecture photoréalistes | BrotherStudio",
      metadataDescription:
        "Images haut de gamme pour promouvoir et vendre vos projets immobiliers.",
      introLine:
        "We help architects and developers present and sell their projects through high-end visualizations.",
      backToTopLabel: "Back to top",
      backToFooterLabel: "Go to footer",
      projectFilterAllLabel: "All",
      projectFilterAriaLabel: "Project filters",
    },
    services: {
      title: "Services",
      metadataDescription:
        "BrotherStudio provides photorealistic 3D architectural images, floor plans, walkthrough videos, and marketing visuals.",
      openGraphDescription:
        "Photorealistic 3D architectural images, floor plans, walkthrough videos, and marketing visuals by BrotherStudio.",
      intro: "BrotherStudio creates photorealistic 3D images and videos for architectural, interior, exterior, and landscape-focused.",
      includedTitle: "Included in pricing",
      services: [
        "3D Photorealistic Interior Images",
        "3D Photorealistic Exterior Images",
        "3D Floor Plans",
        "Marketing brochure floor plans",
        "Video Walkthrough",
        "Marketing Videos",
        "Drone View Videos",
      ],
      pricingIncludes: [
        "Project modeling based on PDF plans",
        "Full environment integration according to client style (furniture, plants, weather, people, etc.)",
        "Image treatment - lighting and materials",
        "Revisions and retouching until client satisfaction",
        "Image delivery up to 6K quality",
        "Delivery of complete documents",
        "Premium renderings: high-definition outputs optimized for real estate marketing (brochures, portals, digital marketing)",
      ],
      ctaText: "For inquiries, contact BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    price: {
      title: "Price",
      metadataDescription:
        "Minimal pricing overview for BrotherStudio architectural visualization services.",
      openGraphDescription:
        "Minimal pricing overview for BrotherStudio photorealistic architectural images and videos.",
      intro:
        "We help architects and developers budget high-end visualizations with clear starting prices.",
      accessTitle: "Private access",
      accessText:
        "Enter your email address to view the pricing page.",
      accessPlaceholder: "Email address",
      accessButton: "Enter",
      accessLegal:
        "Your email is only used to unlock this page on your device.",
      invalidEmail: "Please enter a valid email address.",
      imagesTitle: "Image",
      videosTitle: "Video",
      packagesTitle: "Packages",
      partnershipTitle: "Partnership",
      workflowTitle: "Workflow",
      includedTitle: "Included in pricing",
      imageNote:
        "Focus images offered from 3 ordered images. Selection at BrotherStudio's discretion.",
      images: [
        {
          name: "3D Photorealistic Interior Images",
          price: "CHF 800",
        },
        {
          name: "3D Photorealistic Exterior Images",
          price: "CHF 900",
        },
        {
          name: "3D Floor Plans",
          price: "CHF 400",
        },
        {
          name: "Sales plan for brochure",
          price: "CHF 290",
        },
        {
          name: "Photo (Drone View)",
          price: "CHF 350",
        },
      ],
      videos: [
        {
          name: "Video Walkthrough",
          options: [
            { name: "1-4 rooms", price: "CHF 1700" },
            { name: "5-9 rooms", price: "CHF 3200" },
            { name: "10+ rooms", price: "On request" },
          ],
        },
        {
          name: "Walkthrough Classic (click & walk)",
          options: [
            { name: "1-4 rooms", price: "CHF 1200" },
            { name: "5-9 rooms", price: "CHF 2200" },
          ],
        },
        {
          name: "Marketing Video (emotional / cinematic)",
          options: [
            { name: "1-30 seconds", price: "CHF 2000" },
            { name: "31-60 seconds", price: "CHF 3500" },
            { name: "61-90 seconds", price: "CHF 4800" },
          ],
        },
        {
          name: "Photorealistic 3D Video (Drone View)",
          price: "CHF 1400",
        },
      ],
      packages: [
        {
          name: "Villa package",
          price: "CHF 7000",
          details: [
            "4-6 interior images",
            "2-3 exterior images",
            '1-3 style images (rain, dust, snow)',
            "1-3 focus images included",
            "1x marketing video, 31-60 seconds",
          ],
        },
        {
          name: "Building package",
          price: "On request",
          details: ["Project size review required before pricing."],
        },
      ],
      partnerships: [
        "10% discount for 5+ projects per year",
        "15% discount for 8+ projects per year",
      ],
      workflowIncludesLabel:
        "Includes: interactive review platform to validate and comment on visuals in real time >",
      workflowLinkLabel: "myBrochure",
      workflowComingSoon:
        "Coming soon: immersive and cinematic digital experience to present and promote the project online.",
      ctaText: "For a custom quote, contact BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    about: {
      title: "About",
      location: "Ajax, Canada",
      metadataDescription:
        "Biography of Charles, founder of BrotherStudio, an architectural visualization studio based in Ajax, Canada.",
      biographyTitle: "Biography",
      biographyButtons: {
        expand: "Read more",
        collapse: "Show less",
      },
      intro:
        "Charles is an architectural draftsman and the founder of BrotherStudio, a studio specializing in high-end architectural visualization, landscape atmospheres, and real estate presentation.",
      paragraphs: [
        "He obtained his Architectural Drafting Diploma in 2017 in Sion, Switzerland, beginning his career working on residential architecture projects including luxury chalets, apartment buildings, and neighborhood developments. These early experiences shaped his design sensibility through the strong influence of European architectural culture: precision, balanced proportions, refined materials, and clean spatial composition.",
        "From 2017 to 2022, he contributed to multiple residential developments, translating architectural concepts into clear technical drawings and visual presentations used for design coordination, planning approvals, and project communication.",
        "After relocating to Canada in 2022, he expanded his work beyond technical drafting into architectural visualization and design presentation, while also serving as Mission Director in community initiatives.",
        "In December 2024, he founded BrotherStudio, focusing on photorealistic architectural imagery, marketing floor plans, and visual storytelling for architects, developers, and real estate professionals.",
        "His work explores not only buildings themselves but the complete environments in which architecture exists. Through landscape composition, outdoor living design, and atmospheric visualization, he translates clients' estates and dream homes into immersive environments where gardens, terraces, light, and surrounding landscapes complement and elevate the architectural structures.",
        "By combining European architectural discipline with modern visualization techniques, Charles helps transform architectural concepts into compelling, emotionally engaging, and market-ready visual experiences.",
      ],
      highlightsTitle: "Specialties",
      highlights: [
        "High-end architectural visualization",
        "Landscape atmospheres and outdoor living presentation",
        "Marketing floor plans and real estate imagery",
        "Visual storytelling for architects, developers, and real estate professionals",
      ],
      portraitAlt: "Portrait of Charles, founder of BrotherStudio",
      portraitCaption: "Charles, founder of BrotherStudio.",
      connectTitle: "Connect",
      connectText:
        "For project inquiries, reach BrotherStudio by email or on Instagram.",
      emailLabel: "Email",
      instagramLabel: "Instagram",
      ctaText: "For inquiries, contact BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    contact: {
      title: "Contact",
      detailsTitle: "Details",
      metadataDescription:
        "Contact BrotherStudio in Ajax, Canada for architectural visualization and 3D rendering inquiries.",
      form: {
        labels: {
          name: "Name",
          email: "Email",
          phoneOptional: "Phone (optional)",
          quickPrompt: "Quick Prompt",
          message: "Message",
        },
        buttons: {
          send: "Send",
          sending: "Sending...",
        },
        status: {
          success: "Message sent. We will reply by email soon.",
          genericError: "Failed to send message.",
          chooseQuickPrompt: "Please choose a quick prompt option.",
        },
        promptGroupAriaLabel: "Quick prompts",
        messagePlaceholder:
          "Tell us about your project: type, images or video needed, deadline, plans/PDF available, and any style references.",
        quickPrompts: englishQuickPrompts,
      },
    },
  },
  fr: {
    header: {
      nav: {
        gallery: "Galerie",
        instagram: "Instagram",
        services: "Services",
        price: "Price",
        about: "A propos",
        contact: "Contact",
      },
      localeSwitcherLabel: "Langue",
      localeLabels: { en: "EN", fr: "FR" },
      themeLabels: {
        light: "BLANC",
        dark: "NOIR",
      },
    },
    home: {
      metadataTitle: "Rendus 3D architecture photoréalistes | BrotherStudio",
      metadataDescription:
        "Images haut de gamme pour promouvoir et vendre vos projets immobiliers.",
      introLine:
        "Nous aidons les architectes et les developpeurs a presenter et vendre leurs projets grace a des visualisations haut de gamme.",
      backToTopLabel: "Retour en haut",
      backToFooterLabel: "Aller au footer",
      projectFilterAllLabel: "Tous",
      projectFilterAriaLabel: "Filtres de projet",
    },
    services: {
      title: "Services",
      metadataDescription:
        "BrotherStudio propose des images architecturales 3D photorealistes, floor plans, videos walkthrough et visuels marketing.",
      openGraphDescription:
        "Images architecturales 3D photorealistes, floor plans, videos walkthrough et visuels marketing par BrotherStudio.",
      intro: "BrotherStudio cree des images et videos 3D photorealistes pour des projets architecturaux, interieurs, exterieurs et paysagers.",
      includedTitle: "Inclus dans mes prix",
      services: [
        "Images 3D photorealistes interieures",
        "Images 3D photorealistes exterieures",
        "3D FloorPlan",
        "Plan de vente pour brochure marketing",
        "Video Walkthrough",
        "Video Marketing",
        "Video (drone View)",
      ],
      pricingIncludes: [
        "Modelisation du projet sur base PDF",
        "Integration de l'environnement complet selon style du client (mobilier, vegetaux, meteo, personne, etc.)",
        "Traitement image - Lumiere & materiaux",
        "Modifications & retouche jusqu'a satisfaction client",
        "Livraison d'images jusqu'en qualite 6K",
        "Remise des documents complets",
        "Rendus premium : haute definition optimises pour commercialisation immobiliere (brochures, portails, marketing digital).",
      ],
      ctaText: "Pour toute demande, contactez BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    price: {
      title: "Price",
      metadataDescription:
        "Vue minimaliste des prix de BrotherStudio pour les visualisations architecturales.",
      openGraphDescription:
        "Vue minimaliste des prix BrotherStudio pour images et videos architecturales photorealistes.",
      intro: "",
      accessTitle: "Acces prive",
      accessText:
        "Entrez votre adresse email pour acceder a la page de prix.",
      accessPlaceholder: "Adresse email",
      accessButton: "Entrer",
      accessLegal:
        "Votre email sert uniquement a debloquer cette page sur votre appareil.",
      invalidEmail: "Veuillez entrer une adresse email valide.",
      imagesTitle: "Images",
      videosTitle: "Videos",
      packagesTitle: "Forfait",
      partnershipTitle: "Partenariat",
      workflowTitle: "Workflow",
      includedTitle: "Inclus dans mes prix",
      imageNote:
        "Images focus offertes a partir de 3 images commandees. Choix selon BrotherStudio.",
      images: [
        {
          name: "Images 3D photorealistes interieures",
          price: "CHF 800",
        },
        {
          name: "Images 3D photorealistes exterieures",
          price: "CHF 900",
        },
        {
          name: "3D FloorPlan",
          price: "CHF 400",
        },
        {
          name: "Plan de vente pour brochure",
          price: "CHF 290",
        },
        {
          name: "Photo (Drone View)",
          price: "CHF 350",
        },
      ],
      videos: [
        {
          name: "Video Walkthrough",
          options: [
            { name: "1-4 pieces", price: "CHF 1700" },
            { name: "5-9 pieces", price: "CHF 3200" },
            { name: "10+", price: "Sur demande" },
          ],
        },
        {
          name: "Walkthrough Classic (clic & walk)",
          options: [
            { name: "1-4 pieces", price: "CHF 1200" },
            { name: "5-9 pieces", price: "CHF 2200" },
          ],
        },
        {
          name: "Video Marketing (emotionnelle / cinematique)",
          options: [
            { name: "1-30 secondes", price: "CHF 2000" },
            { name: "31-60 secondes", price: "CHF 3500" },
            { name: "61-90 secondes", price: "CHF 4800" },
          ],
        },
        {
          name: "Videorealistes 3D (Drone View)",
          price: "CHF 1400",
        },
      ],
      packages: [
        {
          name: "Villa forfait",
          price: "CHF 7700",
          details: [
            "4-6 images interieures",
            "2-3 images exterieures",
            '1-3 image style (pluie, poussiere, neige)',
            "1-3 images focus offertes",
            "1x Video marketing, 31-60 secondes",
          ],
        },
        {
          name: "Immeuble forfait",
          price: "Sur demande",
          details: ["Besoin de voir la taille du projet."],
        },
      ],
      partnerships: [
        "10% des 5 images commandees par projet",
        "10% si il y a 5+ projet par annee",
        "15% si il y a 8+ projet par annee",
      ],
      workflowIncludesLabel:
        "Inclut : plateforme de review interactive pour valider et commenter les visuels en temps reel >",
      workflowLinkLabel: "myBrochure",
      workflowComingSoon:
        "Coming soon : experience digitale immersive et cinematique pour presenter et promouvoir le projet en ligne",
      ctaText: "Pour un devis sur mesure, contactez BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    about: {
      title: "A propos",
      location: "Ajax, Canada",
      metadataDescription:
        "Biographie de Charles, fondateur de BrotherStudio, un studio de visualisation architecturale base a Ajax, Canada.",
      biographyTitle: "Biographie",
      biographyButtons: {
        expand: "Lire la suite",
        collapse: "Reduire",
      },
      intro:
        "Charles est dessinateur en architecture et fondateur de BrotherStudio, un studio specialise dans la visualisation architecturale haut de gamme, les atmospheres paysageres et la presentation immobiliere.",
      paragraphs: [
        "Il a obtenu son diplome de dessin architectural en 2017 a Sion, en Suisse, commencant sa carriere sur des projets residentiels incluant des chalets de luxe, des immeubles a appartements et des developpements de quartier. Ces premieres experiences ont faconne sa sensibilite du design sous l'influence forte de la culture architecturale europeenne : precision, proportions equilibrees, materiaux raffines et composition spatiale epuree.",
        "De 2017 a 2022, il a contribue a plusieurs developpements residentiels, traduisant des concepts architecturaux en dessins techniques clairs et en presentations visuelles utilisees pour la coordination de design, les approbations et la communication de projet.",
        "Apres son arrivee au Canada en 2022, il a etendu son travail au-dela du dessin technique vers la visualisation architecturale et la presentation de design, tout en servant egalement comme Mission Director dans des initiatives communautaires.",
        "En decembre 2024, il a fonde BrotherStudio, avec un focus sur les images architecturales photorealistes, les floor plans marketing et le visual storytelling pour les architectes, developpeurs et professionnels de l'immobilier.",
        "Son travail explore non seulement les batiments eux-memes, mais aussi les environnements complets dans lesquels l'architecture existe. A travers la composition paysagere, le design d'espaces de vie exterieurs et la visualisation atmospherique, il traduit les estates et dream homes de ses clients en environnements immersifs ou jardins, terrasses, lumiere et paysages environnants completent et elevent les structures architecturales.",
        "En combinant la rigueur architecturale europeenne avec les techniques modernes de visualisation, Charles aide a transformer des concepts architecturaux en experiences visuelles fortes, engageantes et pretes pour le marche.",
      ],
      highlightsTitle: "Specialites",
      highlights: [
        "Visualisation architecturale haut de gamme",
        "Atmospheres paysageres et presentation d'espaces exterieurs",
        "Floor plans marketing et imagerie immobiliere",
        "Visual storytelling pour architectes, developpeurs et professionnels de l'immobilier",
      ],
      portraitAlt: "Portrait de Charles, fondateur de BrotherStudio",
      portraitCaption: "Charles, fondateur de BrotherStudio.",
      connectTitle: "Contact direct",
      connectText:
        "Pour un projet, contacte BrotherStudio par email ou sur Instagram.",
      emailLabel: "Email",
      instagramLabel: "Instagram",
      ctaText: "Pour toute demande, contactez BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    contact: {
      title: "Contact",
      detailsTitle: "Details",
      metadataDescription:
        "Contactez BrotherStudio a Ajax, Canada pour vos projets de visualisation architecturale et rendu 3D.",
      form: {
        labels: {
          name: "Nom",
          email: "Email",
          phoneOptional: "Telephone (optionnel)",
          quickPrompt: "Quick Prompt",
          message: "Message",
        },
        buttons: {
          send: "Envoyer",
          sending: "Envoi...",
        },
        status: {
          success: "Message envoye. Nous vous repondrons par email rapidement.",
          genericError: "Envoi impossible. Merci de reessayer.",
          chooseQuickPrompt: "Veuillez choisir une option de quick prompt.",
        },
        promptGroupAriaLabel: "Quick prompts",
        messagePlaceholder:
          "Decrivez votre projet : type, images ou video souhaitees, deadline, plans/PDF disponibles et references de style.",
        quickPrompts: frenchQuickPrompts,
      },
    },
  },
};

export function getMessages(locale: Locale) {
  return messagesByLocale[locale];
}
