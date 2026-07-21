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
    sceneFilterAriaLabel: string;
    sceneFilterLabels: {
      video: string;
      all: string;
      bedroom: string;
      livingRoom: string;
      kitchen: string;
      exterior: string;
      bathroom: string;
      focusAmbiance: string;
    };
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
    walkthroughTitle: string;
    websiteTitle: string;
    adsTitle: string;
    packagesTitle: string;
    packageTabLabels: {
      ariaLabel: string;
      classic: string;
      premium: string;
    };
    packageIncludedLabel: string;
    packageDeliveryLabel: string;
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
      subsectionTitle?: string;
      options?: Array<{
        name: string;
        price: string;
      }>;
    }>;
    websites: Array<{
      name: string;
      price: string;
    }>;
    ads: Array<{
      name: string;
      price?: string;
      options?: Array<{
        name: string;
        price?: string;
      }>;
    }>;
    packages: Array<{
      name: string;
      price: string;
      comparePrice?: string;
      period?: string;
      badge?: string;
      summary?: string;
      featured?: boolean;
      sections?: Array<{
        title: string;
        items: string[];
      }>;
      included?: string[];
      delivery?: string[];
      note?: string;
    }>;
    partnerships: string[];
    partnershipNote: string;
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
    paragraphs: Array<{
      title: string;
      text: string;
    }>;
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
        price: "Service & Price",
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
        "From image to sale: an end-to-end workflow to present and sell your projects with impact.",
      backToTopLabel: "Go to top of gallery",
      backToFooterLabel: "Go to bottom of gallery",
      projectFilterAllLabel: "All",
      projectFilterAriaLabel: "Project filters",
      sceneFilterAriaLabel: "Image type filters",
      sceneFilterLabels: {
        video: "All Video",
        all: "All Image",
        bedroom: "Bedroom",
        livingRoom: "Living room",
        kitchen: "Kitchen",
        exterior: "Exterior",
        bathroom: "Bathroom",
        focusAmbiance: "Focus & Ambiance",
      },
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
        "Walkthrough Classic (click & walk)",
        "Marketing Videos",
        "Drone View Videos",
      ],
      pricingIncludes: [
        "Project modeling based on PDF plans",
        "Full environment integration according to client style (furniture, plants, weather, people, etc.)",
        "Image treatment - lighting and materials",
        "Revisions and retouching (3 revisions max)",
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
      intro: "",
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
      walkthroughTitle: "Walkthrough",
      websiteTitle: "Website",
      adsTitle: "Meta Ads Lead Generation",
      packagesTitle: "Sales Packages",
      packageTabLabels: {
        ariaLabel: "Package tiers",
        classic: 'Package "classic"',
        premium: 'Package "premium"',
      },
      packageIncludedLabel: "Overview",
      packageDeliveryLabel: "Delivery",
      partnershipTitle: "Partnership",
      workflowTitle: "Workflow",
      includedTitle: "Included in pricing",
      imageNote:
        "Focus images offered from 3 ordered images. Selection at BrotherStudio's discretion.",
      images: [
        {
          name: "3D Photorealistic Interior Images",
          price: "CHF 700",
        },
        {
          name: "3D Photorealistic Exterior Images",
          price: "CHF 800",
        },
        {
          name: "3D Floor Plans",
          price: "CHF 400",
        },
        {
          name: "3D Photorealistic Focus & ambiance",
          price: "CHF 350",
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
          name: "Video Walkthrough Marketing (65% reduction if images ordered)",
          options: [
            { name: "1-4 rooms", price: "CHF 3500" },
            { name: "5-9 rooms", price: "CHF 4700" },
            { name: "10+ rooms", price: "On request" },
          ],
        },
        {
          name: "Walkthrough Classic (click & walk)",
          subsectionTitle: "Walkthrough",
          options: [
            { name: "per room", price: "CHF 570" },
          ],
        },
        {
          name: "Drone Videorealist 3D",
          price: "From CHF 750",
        },
      ],
      websites: [
        {
          name: "BS template sales website · AI sales agent included",
          price: "CHF 1700",
        },
        {
          name: "Custom website · AI sales agent included",
          price: "From CHF 3400",
        },
      ],
      ads: [
        {
          name: "Campaign setup",
          price: "CHF 670 + your ads budget",
          options: [
            { name: "Meta Ads campaign creation" },
            { name: "Pixel & tracking setup" },
            { name: "Content creation" },
            { name: "Profile targeting" },
            { name: "Retargeting" },
            { name: "Lookalike strategy" },
            { name: "Performance dashboard & report" },
          ],
        },
      ],
      packages: [
        {
          name: "MyStart",
          summary: "Perfect for single residential projects",
          price: "CHF 2990",
          comparePrice: "7670 CHF",
          period: "Per project",
          sections: [
            {
              title: "3D Visualization",
              items: [
                "4 interior / exterior images",
                "2 focus images",
                "Lighting",
                "Materials & furnishing",
                "3 revisions",
                "Up to 4K",
              ],
            },
            {
              title: "Cinematic Video",
              items: [
                "1 Video Walkthrough Marketing (1080p)",
                "Smooth Cinematic Camera Movements",
                "Realistic Lighting & Atmosphere",
                "Optimized for Website & Social Media",
                "Custom Project Branding",
              ],
            },
            {
              title: "Real Estate Sales Website",
              items: [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
              ],
            },
            {
              title: "3D / 2D Floor Plans",
              items: ["-", "-", "-", "-"],
            },
            {
              title: "Sales Agent AI (on website)",
              items: [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
              ],
            },
            {
              title: "Meta Ads Lead Generation",
              items: [],
            },
            {
              title: "MyReview Platform",
              items: [
                "MyReview™ platform",
                "Centralized project review",
                "Comment directly on images",
                "Faster approvals",
                "Reduced email exchanges",
              ],
            },
          ],
          included: [
            "4 interior / exterior images",
            "2 focus images",
            "-",
            "1 Video Walkthrough Marketing (1080p)",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "MyReview Platform",
          ],
          delivery: [
            "4-5 days",
            "Images: 1 day per image",
            "High resolution files",
            "Web optimized files",
            "Ready for marketing",
          ],
        },
        {
          name: "MySales",
          summary: "Most popular for villas & small developments",
          price: "CHF 5990",
          comparePrice: "17800 CHF",
          period: "Per project",
          badge: "Main offer",
          featured: true,
          sections: [
            {
              title: "3D Visualization",
              items: [
                "8 interior / exterior images",
                "3-4 focus images",
                "Lighting",
                "Materials & furnishing",
                "3 revisions",
                "Up to 4K",
              ],
            },
            {
              title: "Cinematic Video",
              items: [
                "1 Video Walkthrough Marketing (1080p)",
                "Smooth Cinematic Camera Movements",
                "Realistic Lighting & Atmosphere",
                "Optimized for Website & Social Media",
                "Custom Project Branding",
              ],
            },
            {
              title: "Real Estate Sales Website",
              items: [
                "AI Sales Assistant trained on your project",
                "Interactive Gallery & Videos",
                "Documentation Centre",
                "Lead Capture & Contact Forms",
                "Google Maps Integration",
                "Mobile & Tablet Optimized",
                "SEO Ready",
                "Real-Time Weather",
                "12-month maintenance",
                "Domain name",
                "Private & secure cloud",
              ],
            },
            {
              title: "3D / 2D Floor Plans",
              items: ["-", "-", "-", "-"],
            },
            {
              title: "Sales Agent AI (on website)",
              items: [
                "Available 24/7",
                "Trained on Your Project",
                "Instant Buyer Assistance",
                "Answers Frequently Asked Questions",
                "Shares Project Information",
                "Guides Buyers Through the Project",
                "Smart Lead Qualification",
              ],
            },
            {
              title: "Meta Ads Lead Generation",
              items: [
                "Meta Ads campaign creation",
                "Advertising budget included: CAD 700",
                "Pixel & tracking setup",
                "Content creation",
                "Profile targeting",
                "Retargeting",
                "Lookalike strategy",
                "Performance dashboard",
              ],
            },
            {
              title: "MyReview Platform",
              items: [
                "MyReview™ platform",
                "Centralized project review",
                "Comment directly on images",
                "Faster approvals",
                "Reduced email exchanges",
              ],
            },
          ],
          included: [
            "8 interior / exterior images",
            "3-4 focus images",
            "1 ambiance image (rain, snow, night, etc.)",
            "1 Video Walkthrough Marketing (1080p)",
            "Website template",
            "Sales Agent AI",
            "Meta Ads Lead Generation",
            "Advertising budget included: CAD 700",
            "-",
            "-",
            "MyReview Platform",
          ],
          delivery: [
            "2-3 weeks for the full package",
            "Images: 1 day per image",
            "High resolution files",
            "Web optimized files",
            "Ready for marketing",
          ],
        },
        {
          name: "MySignature",
          summary: "For premium developments & large-scale projects",
          price: "CHF 8990",
          period: "Per project",
          sections: [
            {
              title: "3D Visualization",
              items: [
                "14 interior / exterior images",
                "6-7 focus images",
                "Lighting",
                "Materials & furnishing",
                "3 revisions",
                "Up to 4K",
              ],
            },
            {
              title: "Cinematic Video",
              items: [
                "1 Video Walkthrough Marketing (1080p)",
                "Smooth Cinematic Camera Movements",
                "Realistic Lighting & Atmosphere",
                "Optimized for Website & Social Media",
                "Custom Project Branding",
              ],
            },
            {
              title: "Real Estate Sales Website",
              items: [
                "AI Sales Assistant trained on your project",
                "Interactive Gallery & Videos",
                "Documentation Centre",
                "Lead Capture & Contact Forms",
                "Google Maps Integration",
                "Mobile & Tablet Optimized",
                "SEO Ready",
                "Real-Time Weather",
                "12-month maintenance",
                "Domain name",
                "Private & secure cloud",
              ],
            },
            {
              title: "3D / 2D Floor Plans",
              items: [
                "Textures",
                "Shadow",
                "Furnishing",
                "Project Branding colors",
              ],
            },
            {
              title: "Sales Agent AI (on website)",
              items: [
                "Available 24/7",
                "Trained on Your Project",
                "Instant Buyer Assistance",
                "Answers Frequently Asked Questions",
                "Shares Project Information",
                "Guides Buyers Through the Project",
                "Smart Lead Qualification",
              ],
            },
            {
              title: "Meta Ads Lead Generation",
              items: [
                "Meta Ads campaign creation",
                "Advertising budget included: CAD 1500",
                "Pixel & tracking setup",
                "Content creation",
                "Profile targeting",
                "Retargeting",
                "Lookalike strategy",
                "Performance dashboard",
              ],
            },
            {
              title: "MyReview Platform",
              items: [
                "MyReview™ platform",
                "Centralized project review",
                "Comment directly on images",
                "Faster approvals",
                "Reduced email exchanges",
              ],
            },
          ],
          included: [
            "14 interior / exterior images",
            "6-7 focus images",
            "2 ambiance images (rain, snow, night, etc.)",
            "1 Video Walkthrough Marketing (1080p)",
            "Custom website",
            "Sales Agent AI",
            "Meta Ads Lead Generation",
            "Advertising budget included: CAD 1500",
            "Installment payment available",
            "3D / 2D Floor Plans",
            "MyReview Platform",
          ],
          delivery: [
            "3-4 weeks for the full package",
            "Images: 1 day per image",
            "High resolution files",
            "Web optimized files",
            "Ready for marketing",
            "Ready for campaigns",
          ],
        },
      ],
      partnerships: [
        "10% discount for 4+ projects per year",
        "15% discount for 6+ projects per year",
        "20% discount for 8+ projects per year",
      ],
      partnershipNote:
        "Agreement based on mutual understanding (no formal contract).\nDiscounts are applied based on the total number of projects completed over the year.\nIf the agreed volume is not reached, a price adjustment may be applied to reflect the actual tier.",
      workflowIncludesLabel:
        "Includes: interactive review platform to validate and comment on visuals in real time >",
      workflowLinkLabel: "MyReview™",
      workflowComingSoon:
        "Coming soon: immersive and cinematic digital experience to present and promote the project online.",
      ctaText: "For a custom quote, contact BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    about: {
      title: "About",
      location: "Ajax, Canada",
      metadataDescription:
        "Biography of Charles, founder of BrotherStudio, a real estate marketing agency for property developers.",
      biographyTitle: "Biography",
      biographyButtons: {
        expand: "Read more",
        collapse: "Show less",
      },
      intro:
        "Charles is an architectural draftsman, digital marketing specialist, and the founder of BrotherStudio, a marketing agency dedicated to helping property developers successfully launch and sell real estate projects.",
      paragraphs: [
        {
          title: "Architectural foundation",
          text: "He earned his Architectural Drafting Diploma in 2017 in Sion, Switzerland, where he began his career working on luxury chalets, apartment buildings, and residential developments. These years shaped his understanding of architecture through the influence of European design principles: precision, balanced proportions, refined materials, and timeless composition.",
        },
        {
          title: "Real estate experience",
          text: "From 2017 to 2022, he contributed to numerous residential projects, producing technical drawings and architectural documentation while developing a deep understanding of the real estate development process.",
        },
        {
          title: "Digital marketing background",
          text: "Alongside his architectural career, Charles spent more than three years building businesses in e-commerce, specializing in digital marketing, online advertising, sales funnels, and lead generation. This experience allowed him to master customer acquisition strategies, performance marketing, and conversion optimization—skills that now play a central role in BrotherStudio's approach.",
        },
        {
          title: "A new real estate service",
          text: "After relocating to Canada in 2022, he combined his architectural expertise with his marketing background to create a new type of service for the real estate industry.",
        },
        {
          title: "BrotherStudio",
          text: "Founded in December 2024, BrotherStudio has evolved beyond architectural visualization into a real estate marketing partner. Rather than simply producing beautiful images, the studio helps developers transform projects into market-ready brands by combining photorealistic renderings, cinematic videos, project websites, digital advertising campaigns, and lead generation systems designed to attract qualified buyers before construction is completed.",
        },
        {
          title: "Marketing philosophy",
          text: "Charles believes that exceptional architecture deserves exceptional marketing. His philosophy is that visual presentation is only the beginning—the ultimate objective is generating interest, qualified leads, and successful property sales.",
        },
        {
          title: "From concept to sale",
          text: "Today, BrotherStudio combines European architectural discipline with modern digital marketing strategies to help property developers move seamlessly from concept to sale.",
        },
      ],
      highlightsTitle: "Team",
      highlights: [
        "Alexa D. / Administration",
        "Veronique P. / Real estate broker",
        "Muriella R. / Design & Assistance",
        "Elsa R. / Sales representative",
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
        price: "Service & Price",
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
        "De l’image à la vente : un workflow complet pour présenter et vendre vos projets avec impact.",
      backToTopLabel: "Aller en haut de la galerie",
      backToFooterLabel: "Aller en bas de la galerie",
      projectFilterAllLabel: "Tous",
      projectFilterAriaLabel: "Filtres de projet",
      sceneFilterAriaLabel: "Filtres de type d'image",
      sceneFilterLabels: {
        video: "Toutes les vidéos",
        all: "Toutes les images",
        bedroom: "Chambre",
        livingRoom: "Living room",
        kitchen: "Cuisine",
        exterior: "Exterieure",
        bathroom: "Salle de bain",
        focusAmbiance: "Focus & Ambiance",
      },
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
        "Walkthrough Classic (click & walk)",
        "Video Marketing",
        "Video (drone View)",
      ],
      pricingIncludes: [
        "Modelisation du projet sur base PDF",
        "Integration de l'environnement complet selon style du client (mobilier, vegetaux, meteo, personne, etc.)",
        "Traitement image - Lumiere & materiaux",
        "Modifications & retouche (3 revisions max)",
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
      walkthroughTitle: "Walkthrough",
      websiteTitle: "Website",
      adsTitle: "Meta Ads Lead Generation",
      packagesTitle: "Packages de vente",
      packageTabLabels: {
        ariaLabel: "Niveaux de forfait",
        classic: 'Package "classic"',
        premium: 'Package "premium"',
      },
      packageIncludedLabel: "Aperçu",
      packageDeliveryLabel: "Livraison",
      partnershipTitle: "Partenariat",
      workflowTitle: "Workflow",
      includedTitle: "Inclus dans mes prix",
      imageNote:
        "Images focus offertes a partir de 3 images commandees. Choix selon BrotherStudio.",
      images: [
        {
          name: "Images 3D photorealistes interieures",
          price: "CHF 700",
        },
        {
          name: "Images 3D photorealistes exterieures",
          price: "CHF 800",
        },
        {
          name: "3D FloorPlan",
          price: "CHF 400",
        },
        {
          name: "3D Photorealistic Focus & ambiance",
          price: "CHF 350",
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
          name: "Video Walkthrough Marketing (65% reduction si images commandees)",
          options: [
            { name: "1-4 pieces", price: "CHF 3500" },
            { name: "5-9 pieces", price: "CHF 4700" },
            { name: "10+", price: "Sur demande" },
          ],
        },
        {
          name: "Walkthrough Classic (clic & walk)",
          subsectionTitle: "Walkthrough",
          options: [
            { name: "par piece", price: "CHF 570" },
          ],
        },
        {
          name: "Videorealistes 3D (Drone View)",
          price: "From CHF 750",
        },
      ],
      websites: [
        {
          name: "BS template sales website · Agent IA de vente inclus",
          price: "CHF 1700",
        },
        {
          name: "Site de vente custom · Agent IA de vente inclus",
          price: "From CHF 3400",
        },
      ],
      ads: [
        {
          name: "Setup de campagne",
          price: "CHF 670 + votre budget pub",
          options: [
            { name: "Creation de campagne Meta Ads" },
            { name: "Pixel & tracking setup" },
            { name: "Creation de contenu" },
            { name: "Profile targeting" },
            { name: "Retargeting" },
            { name: "Lookalike strategy" },
            { name: "Performance dashboard & report" },
          ],
        },
      ],
      packages: [
        {
          name: "MyStart",
          summary: "Ideal pour les projets residentiels uniques",
          price: "CHF 2990",
          comparePrice: "7670 CHF",
          period: "Par projet",
          sections: [
            {
              title: "3D Visualization",
              items: [
                "4 images interieures / exterieures",
                "2 images focus",
                "Lumiere",
                "Materiaux & fourniture",
                "3 revisions",
                "Jusqu'a 4K",
              ],
            },
            {
              title: "Video cinematographique",
              items: [
                "1 Video Walkthrough Marketing (1080p)",
                "Mouvements de camera cinematographiques fluides",
                "Lumiere & ambiance realistes",
                "Optimise pour website & reseaux sociaux",
                "Branding projet personnalise",
              ],
            },
            {
              title: "Site web de vente immobiliere",
              items: [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
              ],
            },
            {
              title: "3D / 2D Floor Plans",
              items: ["-", "-", "-", "-"],
            },
            {
              title: "Agent IA de vente (sur le site web)",
              items: [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
              ],
            },
            {
              title: "Meta Ads Lead Generation",
              items: [],
            },
            {
              title: "Plateforme MyReview",
              items: [
                "Plateforme MyReview™",
                "Review centralisee du projet",
                "Commentaires directs sur les images",
                "Approvals plus rapides",
                "Moins d'emails",
              ],
            },
          ],
          included: [
            "4 images interieures / exterieures",
            "2 images focus",
            "-",
            "1 Video Walkthrough Marketing (1080p)",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "Plateforme MyReview",
          ],
          delivery: [
            "4-5 jours",
            "Images : 1 jour par image",
            "Fichiers haute resolution",
            "Fichiers optimises pour le web",
            "Pret pour le marketing",
          ],
        },
        {
          name: "MySales",
          summary: "Le plus populaire pour les villas et petits developpements",
          price: "CHF 5990",
          comparePrice: "17800 CHF",
          period: "Par projet",
          badge: "Offre principale",
          featured: true,
          sections: [
            {
              title: "3D Visualization",
              items: [
                "8 images interieures / exterieures",
                "3-4 images focus",
                "Lumiere",
                "Materiaux & fourniture",
                "3 revisions",
                "Jusqu'a 4K",
              ],
            },
            {
              title: "Video cinematographique",
              items: [
                "1 Video Walkthrough Marketing (1080p)",
                "Mouvements de camera cinematographiques fluides",
                "Lumiere & ambiance realistes",
                "Optimise pour website & reseaux sociaux",
                "Branding projet personnalise",
              ],
            },
            {
              title: "Site web de vente immobiliere",
              items: [
                "Agent IA de vente entraine sur votre projet",
                "Galerie interactive & videos",
                "Centre de documentation",
                "Capture de leads & formulaires de contact",
                "Integration Google Maps",
                "Optimise mobile & tablette",
                "SEO ready",
                "Meteo en temps reel",
                "Maintenance 12 mois",
                "Nom de domaine",
                "Cloud prive et securise",
              ],
            },
            {
              title: "3D / 2D Floor Plans",
              items: ["-", "-", "-", "-"],
            },
            {
              title: "Agent IA de vente (sur le site web)",
              items: [
                "Disponible 24/7",
                "Entraine sur votre projet",
                "Assistance acheteur instantanee",
                "Repond aux questions frequentes",
                "Partage les informations du projet",
                "Guide les acheteurs a travers le projet",
                "Qualification intelligente des leads",
              ],
            },
            {
              title: "Meta Ads Lead Generation",
              items: [
                "Creation de campagne Meta Ads",
                "Budget publicitaire inclu : CAD 700",
                "Pixel et tracking setup",
                "Creation de contenu",
                "Ciblage de profils",
                "Retargeting",
                "Strategie lookalike",
                "Dashboard de performance",
              ],
            },
            {
              title: "Plateforme MyReview",
              items: [
                "Plateforme MyReview™",
                "Review centralisee du projet",
                "Commentaires directs sur les images",
                "Approvals plus rapides",
                "Moins d'emails",
              ],
            },
          ],
          included: [
            "8 images interieures / exterieures",
            "3-4 images focus",
            "1 image ambiance (pluie, neige, nuit, etc.)",
            "1 Video Walkthrough Marketing (1080p)",
            "Website Template",
            "Sales Agent AI",
            "Meta Ads Lead Generation",
            "Budget publicitaire inclu : CAD 700",
            "-",
            "-",
            "Plateforme MyReview",
          ],
          delivery: [
            "Compter 2-3 semaines pour le package complet",
            "Images : 1 jour par image",
            "Fichiers haute resolution",
            "Fichiers optimises pour le web",
            "Pret pour le marketing",
          ],
        },
        {
          name: "MySignature",
          summary: "Pour les developpements premium et projets de grande envergure",
          price: "CHF 8990",
          period: "Par projet",
          sections: [
            {
              title: "3D Visualization",
              items: [
                "14 images interieures / exterieures",
                "6-7 images focus",
                "Lumiere",
                "Materiaux & fourniture",
                "3 revisions",
                "Jusqu'a 4K",
              ],
            },
            {
              title: "Video cinematographique",
              items: [
                "1 Video Walkthrough Marketing (1080p)",
                "Mouvements de camera cinematographiques fluides",
                "Lumiere & ambiance realistes",
                "Optimise pour website & reseaux sociaux",
                "Branding projet personnalise",
              ],
            },
            {
              title: "Site web de vente immobiliere",
              items: [
                "Agent IA de vente entraine sur votre projet",
                "Galerie interactive & videos",
                "Centre de documentation",
                "Capture de leads & formulaires de contact",
                "Integration Google Maps",
                "Optimise mobile & tablette",
                "SEO ready",
                "Meteo en temps reel",
                "Maintenance 12 mois",
                "Nom de domaine",
                "Cloud prive et securise",
              ],
            },
            {
              title: "3D / 2D Floor Plans",
              items: [
                "Textures",
                "Ombre",
                "Fournitures",
                "Couleurs de branding projet",
              ],
            },
            {
              title: "Agent IA de vente (sur le site web)",
              items: [
                "Disponible 24/7",
                "Entraine sur votre projet",
                "Assistance acheteur instantanee",
                "Repond aux questions frequentes",
                "Partage les informations du projet",
                "Guide les acheteurs a travers le projet",
                "Qualification intelligente des leads",
              ],
            },
            {
              title: "Meta Ads Lead Generation",
              items: [
                "Creation de campagne Meta Ads",
                "Budget publicitaire inclu : CAD 1500",
                "Pixel et tracking setup",
                "Creation de contenu",
                "Ciblage de profils",
                "Retargeting",
                "Strategie lookalike",
                "Dashboard de performance",
              ],
            },
            {
              title: "Plateforme MyReview",
              items: [
                "Plateforme MyReview™",
                "Review centralisee du projet",
                "Commentaires directs sur les images",
                "Approvals plus rapides",
                "Moins d'emails",
              ],
            },
          ],
          included: [
            "14 images interieures / exterieures",
            "6-7 images focus",
            "2 images ambiance (pluie, neige, nuit, etc.)",
            "1 Video Walkthrough Marketing (1080p)",
            "Website Custom",
            "Sales Agent AI",
            "Meta Ads Lead Generation",
            "Budget publicitaire inclu : CAD 1500",
            "Paiement echelonne",
            "3D / 2D Floor Plans",
            "Plateforme MyReview",
          ],
          delivery: [
            "3-4 semaines pour le package complet",
            "Images : 1 jour par image",
            "Fichiers haute resolution",
            "Fichiers optimises pour le web",
            "Pret pour le marketing",
            "Pret pour les campagnes",
          ],
        },
      ],
      partnerships: [
        "10% discount for 4+ projects per year",
        "15% discount for 6+ projects per year",
        "20% discount for 8+ projects per year",
      ],
      partnershipNote:
        "Agreement based on mutual understanding (no formal contract).\nDiscounts are applied based on the total number of projects completed over the year.\nIf the agreed volume is not reached, a price adjustment may be applied to reflect the actual tier.",
      workflowIncludesLabel:
        "Inclut : plateforme de review interactive pour valider et commenter les visuels en temps reel >",
      workflowLinkLabel: "MyReview™",
      workflowComingSoon:
        "Coming soon : experience digitale immersive et cinematique pour presenter et promouvoir le projet en ligne",
      ctaText: "Pour un devis sur mesure, contactez BrotherStudio.",
      ctaLinkLabel: "Contact",
    },
    about: {
      title: "A propos",
      location: "Ajax, Canada",
      metadataDescription:
        "Biography of Charles, founder of BrotherStudio, a real estate marketing agency for property developers.",
      biographyTitle: "Biographie",
      biographyButtons: {
        expand: "Lire la suite",
        collapse: "Reduire",
      },
      intro:
        "Charles is an architectural draftsman, digital marketing specialist, and the founder of BrotherStudio, a marketing agency dedicated to helping property developers successfully launch and sell real estate projects.",
      paragraphs: [
        {
          title: "Architectural foundation",
          text: "He earned his Architectural Drafting Diploma in 2017 in Sion, Switzerland, where he began his career working on luxury chalets, apartment buildings, and residential developments. These years shaped his understanding of architecture through the influence of European design principles: precision, balanced proportions, refined materials, and timeless composition.",
        },
        {
          title: "Real estate experience",
          text: "From 2017 to 2022, he contributed to numerous residential projects, producing technical drawings and architectural documentation while developing a deep understanding of the real estate development process.",
        },
        {
          title: "Digital marketing background",
          text: "Alongside his architectural career, Charles spent more than three years building businesses in e-commerce, specializing in digital marketing, online advertising, sales funnels, and lead generation. This experience allowed him to master customer acquisition strategies, performance marketing, and conversion optimization—skills that now play a central role in BrotherStudio's approach.",
        },
        {
          title: "A new real estate service",
          text: "After relocating to Canada in 2022, he combined his architectural expertise with his marketing background to create a new type of service for the real estate industry.",
        },
        {
          title: "BrotherStudio",
          text: "Founded in December 2024, BrotherStudio has evolved beyond architectural visualization into a real estate marketing partner. Rather than simply producing beautiful images, the studio helps developers transform projects into market-ready brands by combining photorealistic renderings, cinematic videos, project websites, digital advertising campaigns, and lead generation systems designed to attract qualified buyers before construction is completed.",
        },
        {
          title: "Marketing philosophy",
          text: "Charles believes that exceptional architecture deserves exceptional marketing. His philosophy is that visual presentation is only the beginning—the ultimate objective is generating interest, qualified leads, and successful property sales.",
        },
        {
          title: "From concept to sale",
          text: "Today, BrotherStudio combines European architectural discipline with modern digital marketing strategies to help property developers move seamlessly from concept to sale.",
        },
      ],
      highlightsTitle: "Team",
      highlights: [
        "Alexa D. / Administration",
        "Veronique P. / Courtiere immobiliere",
        "Muriella R. / Design & Assistance",
        "Elsa R. / Representante des ventes",
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
