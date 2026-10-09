import { statusLabel, VALUATION_TIME_ZONE, type ValuationRequest } from "./valuationRequests";
const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: VALUATION_TIME_ZONE });
export function buildValuationCsv(requests: ValuationRequest[]): string {
  const rows: (string | number | null)[][] = [["Prénom", "Nom", "Email", "Téléphone", "Type de bien", "Adresse", "Pièces", "Surface", "Prix souhaité CHF", "Délai de vente", "Créneau de contact", "Formulaire reçu (Toronto)", "Statut", "Prochaine relance", "Notes"]];
  for (const request of requests) rows.push([request.first_name, request.last_name, request.email, request.phone, request.property_type, request.property_address, request.room_count, request.approximate_area, request.desired_price_chf, request.sale_timeline, request.contact_time, dateFormatter.format(new Date(request.created_at)), statusLabel(request.status), request.next_follow_up, request.notes]);
  return rows.map(row => row.map(value => {
    let text = String(value ?? "");
    // Prevent formulas supplied through public forms from executing in spreadsheet apps.
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(";")).join("\r\n");
}
