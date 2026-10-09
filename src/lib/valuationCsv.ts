import { VISIT_STATUSES } from "./estate";
import { statusLabel, VALUATION_TIME_ZONE, type ValuationRequest } from "./valuationRequests";
const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: VALUATION_TIME_ZONE });
export function buildValuationCsv(requests: ValuationRequest[], visits = false): string {
  const rows: (string | number | null)[][] = [["Prénom", "Nom", "Email", "Téléphone", "Type de bien", "Adresse", "Pièces", "Surface", "Prix souhaité CHF", "Délai de vente", "Créneau de contact", "Formulaire reçu (Toronto)", "Statut", "Prochaine relance", "Notes"]];
  if (visits) {
    rows[0] = ["Prénom", "Nom", "Email", "Téléphone", "Bien concerné", "Référence du bien", "Langue", "Reçu (Toronto)", "Statut", "Prochaine relance", "Notes"];
    for (const r of requests) rows.push([r.first_name,r.last_name,r.email,r.phone,r.property_address,r.property_slug ?? '',r.locale ?? '',dateFormatter.format(new Date(r.created_at)),VISIT_STATUSES.find(s=>s.value===r.status)?.label ?? r.status,r.next_follow_up,r.notes]);
  } else {
  for (const request of requests) rows.push([request.first_name, request.last_name, request.email, request.phone, request.property_type, request.property_address, request.room_count, request.approximate_area, request.desired_price_chf, request.sale_timeline, request.contact_time, dateFormatter.format(new Date(request.created_at)), statusLabel(request.status), request.next_follow_up, request.notes]);
  }
  return rows.map(row => row.map(value => {
    let text = String(value ?? "");
    // Prevent formulas supplied through public forms from executing in spreadsheet apps.
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(";")).join("\r\n");
}
