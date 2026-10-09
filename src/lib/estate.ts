export const ESTATE_CATEGORIES = ['Appartement', 'Maison & villa', 'Chalet', 'Projet neuf', 'Terrain', 'Raccard & mayen', 'Immeuble locatif', 'À rénover'] as const;
export type EstateContent = { title: string; location: string; status: string; price: string; rooms: string; area: string; outdoorArea?: string; exterior: string; description: string };
export type EstateProperty = {
 id: string; category: string; published: boolean; featured: boolean; sort_order: number;
 image: string; images: string[]; documents: { title: string; title_en: string; type: string; href: string }[];
 content_fr: EstateContent; content_en: EstateContent; updated_at: string;
};
export type PublicEstateProperty = EstateContent & { id: string; category: string; featured: boolean; image: string; images: string[]; documents: { title: string; type: string; href: string }[]; facts: {label: string; value: string}[]; updatedAt: string };
export function localizeEstate(p: EstateProperty, locale: string): PublicEstateProperty {
 const c = normalizeEstateContent(locale === 'fr' ? p.content_fr : p.content_en, p.category);
 return { ...c, id: p.id, category: p.category, featured: p.featured, image: p.image, images: p.images, updatedAt: p.updated_at,
 documents: p.documents.map(d => ({...d,title:locale === 'fr' ? d.title : d.title_en})),
 facts: [{label:'Type de bien',value:p.category},{label:'Pièces',value:c.rooms},{label:'Surface habitation',value:c.area || 'À compléter'},{label:'Surface extérieure',value:c.outdoorArea || 'À compléter'},{label:'Extérieur / stationnement',value:c.exterior},{label:'Disponibilité / statut',value:c.status}] };
}
export const VISIT_STATUSES = [
 {value:'new',label:'Nouveau'}, {value:'contacted',label:'Contacté'}, {value:'valuation',label:'Visite planifiée'},
 {value:'mandate',label:'Offre en cours'}, {value:'closed',label:'Conclu'}, {value:'lost',label:'Sans suite'}
] as const;
export function safeEstateUrl(value: unknown): value is string {
 if(typeof value !== 'string' || value.length > 2000 || /[\\\s]/.test(value)) return false;
 if(value.startsWith('/') && !value.startsWith('//')) return true;
 try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export function validateEstate(value: unknown): EstateProperty | null {
 if(!value || typeof value !== 'object') return null;
 const p = value as EstateProperty;
 if(typeof p.id !== 'string' || p.id.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id) || ['biens','vendre','admin'].includes(p.id)) return null;
 if(!ESTATE_CATEGORIES.some(c=>c===p.category) || typeof p.published !== 'boolean' || typeof p.featured !== 'boolean' || !Number.isInteger(p.sort_order) || Math.abs(p.sort_order)>100000) return null;
 if(!safeEstateUrl(p.image) || !Array.isArray(p.images) || !p.images.length || p.images.length>40 || !p.images.every(safeEstateUrl)) return null;
 if(!Array.isArray(p.documents) || p.documents.length>20 || !p.documents.every(d=>d && safeEstateUrl(d.href) && ['title','title_en','type'].every(k=>typeof d[k as keyof typeof d]==='string' && d[k as keyof typeof d].length<=200))) return null;
 for(const c of [p.content_fr,p.content_en]) {
  if(!c || ['title','location','status','price','rooms','area','exterior','description'].some(k=>typeof c[k as keyof EstateContent]!=='string' || (c[k as keyof EstateContent] as string).length > (k==='description'?15000:300))) return null;
  if(c.outdoorArea !== undefined && (typeof c.outdoorArea !== 'string' || c.outdoorArea.length > 300)) return null;
  if(p.published && ['title','location','status','price','description'].some(k=>!(c[k as keyof EstateContent] as string).trim())) return null;
 }
 return p;
}

export const ESTATE_STATUSES = [
 {fr:'À vendre',en:'For sale'},
 {fr:'Disponible immédiatement',en:'Available immediately'},
 {fr:'À convenir',en:'By arrangement'},
 {fr:'À rénover',en:'For renovation'},
 {fr:'À rafraîchir',en:'Needs updating'},
 {fr:'À construire',en:'To be built'},
 {fr:'En construction',en:'Under construction'},
 {fr:'Projet neuf',en:'New development'},
 {fr:'Vente sur plans',en:'Off-plan sale'},
 {fr:'Projet + permis',en:'Development + permit'},
 {fr:'Terrain',en:'Land'},
 {fr:'Réservé',en:'Reserved'},
 {fr:'Vendu',en:'Sold'},
] as const;

/** Adapt legacy listings once; explicit outdoorArea (even empty) marks the new format. */
export function normalizeEstateContent(content: EstateContent, category: string): EstateContent {
 if (content.outdoorArea !== undefined) return content;
 let area = content.area;
 let outdoorArea = '';
 let exterior = content.exterior;
 const outdoorWords = /jardin|garden|parcelle|plot|terrain|terrasse|terrace|balcon|balcony/i;
 const measurement = /\d[\d\s’',.]*\s*m[²2]/i;
 if (measurement.test(area) && (category === 'Terrain' || outdoorWords.test(area))) {
  outdoorArea = area;
  area = '';
 } else if (measurement.test(exterior) && outdoorWords.test(exterior)) {
  outdoorArea = exterior;
  exterior = '';
 }
 // This legacy listing explicitly describes its 8,500 m² as a plot, not living space.
 if (!outdoorArea && /^(8[’',\s]?500)\s*m²$/.test(area) && /(?:parcelle de 8[’',\s]?500|8[’',\s]?500 m² plot)/i.test(content.description)) {
  outdoorArea = area;
  area = '';
 }
 return {...content, area, outdoorArea, exterior};
}
