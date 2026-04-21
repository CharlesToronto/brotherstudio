import type {
  BrochureSection,
  BrochureSectionDefinition,
  BrochureSectionKind,
} from "@/lib/brochureTypes";
import {
  createDefaultLayoutItemsForSection,
  createEmptySocialLinks,
} from "@/lib/brochureCanvas";

export const BROCHURE_SECTION_DEFINITIONS: BrochureSectionDefinition[] = [
  {
    kind: "blank",
    label: "Section vierge",
    defaultTitle: "",
    defaultSubtitle: "",
    defaultBody: "",
  },
  {
    kind: "cover",
    label: "Page de couverture",
    defaultTitle: "Project brochure",
    defaultSubtitle: "High-end real estate presentation",
    defaultBody: "A sharp and immediate presentation of the project.",
  },
  {
    kind: "introduction",
    label: "Introduction / concept",
    defaultTitle: "Vision du projet",
    defaultSubtitle: "Positionnement",
    defaultBody:
      "Introduce the project vision, its tone, and the overall value it brings to the market.",
  },
  {
    kind: "location",
    label: "Localisation",
    defaultTitle: "Location",
    defaultSubtitle: "Ville / quartier",
    defaultBody:
      "Present the location, nearby landmarks, transport access, and local advantages.",
  },
  {
    kind: "architecture",
    label: "Le projet / architecture",
    defaultTitle: "Architecture",
    defaultSubtitle: "Building identity",
    defaultBody:
      "Describe the building, its materiality, and the design principles behind the project.",
  },
  {
    kind: "exteriors",
    label: "Les extérieurs",
    defaultTitle: "Exteriors",
    defaultSubtitle: "Facade and landscape",
    defaultBody:
      "Highlight facades, green spaces, the plot, and the surrounding environment.",
  },
  {
    kind: "interiors",
    label: "Les intérieurs",
    defaultTitle: "Interiors",
    defaultSubtitle: "Lifestyle and atmosphere",
    defaultBody:
      "Show the mood, quality of finishes, and the daily living experience inside the project.",
  },
  {
    kind: "plans",
    label: "Plans",
    defaultTitle: "Plans",
    defaultSubtitle: "Layouts and surfaces",
    defaultBody:
      "Add floor plans, unit plans, and key dimensional information.",
  },
  {
    kind: "typologies",
    label: "Typologies / lots disponibles",
    defaultTitle: "Available typologies",
    defaultSubtitle: "Units and surfaces",
    defaultBody:
      "Present the different unit types, number of rooms, surfaces, and optional pricing.",
  },
  {
    kind: "amenities",
    label: "Prestations / équipements",
    defaultTitle: "Amenities",
    defaultSubtitle: "Equipment and finishes",
    defaultBody:
      "List the project equipment, technical features, and finish options.",
  },
  {
    kind: "advantages",
    label: "Avantages clés",
    defaultTitle: "Key advantages",
    defaultSubtitle: "Project strengths",
    defaultBody:
      "Summarize the strongest selling points and, where relevant, investment arguments.",
  },
  {
    kind: "practical",
    label: "Informations pratiques",
    defaultTitle: "Practical information",
    defaultSubtitle: "Delivery and partners",
    defaultBody:
      "Add delivery timeline, promoter, architect, and purchasing conditions.",
  },
  {
    kind: "cta",
    label: "Call to action",
    defaultTitle: "Contact us",
    defaultSubtitle: "Next step",
    defaultBody:
      "Invite the reader to contact the team, reserve a visit, or request more information.",
  },
  {
    kind: "final",
    label: "Page finale",
    defaultTitle: "Final notes",
    defaultSubtitle: "Legal and contact",
    defaultBody:
      "Add the logo, legal mentions, disclaimers, and final contact information.",
  },
];

export function getBrochureSectionDefinition(kind: BrochureSectionKind) {
  return BROCHURE_SECTION_DEFINITIONS.find((definition) => definition.kind === kind);
}

export function createBrochureSection(kind: BrochureSectionKind): BrochureSection {
  const definition = getBrochureSectionDefinition(kind);

  return {
    id: crypto.randomUUID(),
    kind,
    title: definition?.defaultTitle ?? "Section",
    subtitle: definition?.defaultSubtitle ?? "",
    body: definition?.defaultBody ?? "",
    imageIds: [],
    layoutItems: createDefaultLayoutItemsForSection(kind),
    socialLinks: kind === "final" ? createEmptySocialLinks() : undefined,
  };
}
