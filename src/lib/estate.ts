export const ESTATE_CATEGORIES = ['Appartement', 'Maison & villa', 'Chalet', 'Projet neuf', 'Terrain', 'Raccard & mayen', 'Immeuble locatif', 'À rénover'] as const;
export type EstateContent = { title: string; location: string; status: string; price: string; rooms: string; area: string; exterior: string; description: string };
export type EstateProperty = {
 id: string; category: string; published: boolean; featured: boolean; sort_order: number;
 image: string; images: string[]; documents: { title: string; title_en: string; type: string; href: string }[];
 content_fr: EstateContent; content_en: EstateContent; updated_at: string;
};
export type PublicEstateProperty = EstateContent & { id: string; category: string; featured: boolean; image: string; images: string[]; documents: { title: string; type: string; href: string }[]; facts: {label: string; value: string}[] };
export function localizeEstate(p: EstateProperty, locale: string): PublicEstateProperty {
 const c = locale === 'fr' ? p.content_fr : p.content_en;
 return { ...c, id: p.id, category: p.category, featured: p.featured, image: p.image, images: p.images,
 documents: p.documents.map(d => ({...d,title:locale === 'fr' ? d.title : d.title_en})),
 facts: [{label:'Type de bien',value:p.category},{label:'Pièces',value:c.rooms},{label:'Surface habitable',value:c.area},{label:'Extérieur / stationnement',value:c.exterior},{label:'Disponibilité',value:'À convenir'}] };
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
  if(!c || ['title','location','status','price','rooms','area','exterior','description'].some(k=>typeof c[k as keyof EstateContent]!=='string' || c[k as keyof EstateContent].length > (k==='description'?15000:300))) return null;
  if(p.published && ['title','location','status','price','description'].some(k=>!c[k as keyof EstateContent].trim())) return null;
 }
 return p;
}
