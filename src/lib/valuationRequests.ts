export type ValuationRequest = {
  id: string;
  property_slug?: string;
  property_title?: string;
  locale?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  property_type: string;
  property_address: string;
  room_count: string;
  approximate_area: string | null;
  contact_time: string;
  sale_timeline: string;
  desired_price_chf: number | null;
  created_at: string;
  status: ValuationStatus;
  notes: string;
  next_follow_up: string | null;
  updated_at: string;
};

export const VALUATION_STATUSES = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "valuation", label: "Estimation en cours" },
  { value: "mandate", label: "Mandat signé" },
  { value: "closed", label: "Vendu" },
  { value: "lost", label: "Sans suite" },
] as const;
export type ValuationStatus = (typeof VALUATION_STATUSES)[number]["value"];
export const VALUATION_TIME_ZONE = "America/Toronto";
export function valuationDateKey(value: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: VALUATION_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
export function statusLabel(status: ValuationStatus) {
  return VALUATION_STATUSES.find(item => item.value === status)?.label ?? status;
}
export function isOpenProspect(request: Pick<ValuationRequest, "status">) {
  return !["closed", "lost"].includes(request.status);
}
