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
  };
  services: {
    title: string;
    metadataDescription: string;
    openGraphDescription: string;
    intro: string;
    includedTitle: string;
    services: string[];
    pricingIncludes: string[];
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
      metadataTitle: "BrotherStudio - 3D Rendering",
      metadataDescription:
        "BrotherStudio creates photorealistic 3D architectural renderings, interior visualizations, and landscape design images for residential projects, kitchens, and concept spaces in Canada.",
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
        "Video Walkthrough",
        "Marketing Videos",
        "Drone View Videos",
      ],
      pricingIncludes: [
        "Project modeling based on PDF plans",
        "Full environment integration according to client style (furniture, plants, weather, people, etc.)",
        "Image treatment - lighting and materials",
        "Revisions and retouching until client satisfaction",
        "Delivery of complete documents",
        "Premium renderings: high-definition outputs optimized for real estate marketing (brochures, portals, digital marketing)",
      ],
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
      metadataTitle: "BrotherStudio - Rendu 3D",
      metadataDescription:
        "BrotherStudio cree des rendus 3D photorealistes, visualisations interieures et images de paysage pour des projets residentiels, cuisines et espaces conceptuels au Canada.",
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
        "Video Walkthrough",
        "Video Marketing",
        "Video (drone View)",
      ],
      pricingIncludes: [
        "Modelisation du projet sur base PDF",
        "Integration de l'environnement complet selon style du client (mobilier, vegetaux, meteo, personne, etc.)",
        "Traitement image - Lumiere & materiaux",
        "Modifications & retouche jusqu'a satisfaction client",
        "Remise des documents complets",
        "Rendus premium : haute definition optimises pour commercialisation immobiliere (brochures, portails, marketing digital).",
      ],
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
