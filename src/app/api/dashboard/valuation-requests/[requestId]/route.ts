import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { VALUATION_STATUSES } from "@/lib/valuationRequests";

const headers = { "Cache-Control": "private, no-store" };
export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    if (!(await hasAdminSession())) return NextResponse.json({ error: "Connexion administrateur requise." }, { status: 401, headers });
    if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origine invalide." }, { status: 403, headers });
    const { requestId } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) return NextResponse.json({ error: "Demande invalide." }, { status: 400, headers });
    const body = await request.json().catch(() => null);
    if (!body || !VALUATION_STATUSES.some(item => item.value === body.status) || typeof body.notes !== "string" || body.notes.length > 20000 || typeof body.updatedAt !== "string" || !Number.isFinite(Date.parse(body.updatedAt))) {
      return NextResponse.json({ error: "Informations de suivi invalides." }, { status: 400, headers });
    }
    const nextFollowUp = body.nextFollowUp;
    if (nextFollowUp !== null && (typeof nextFollowUp !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUp) || !Number.isFinite(Date.parse(nextFollowUp)) || new Date(nextFollowUp).toISOString().slice(0, 10) !== nextFollowUp)) {
      return NextResponse.json({ error: "Date de relance invalide." }, { status: 400, headers });
    }
    const { data, error } = await getSupabaseAdminClient().from("property_valuation_requests")
      .update({ status: body.status, notes: body.notes.trim(), next_follow_up: nextFollowUp, updated_at: new Date().toISOString() })
      .eq("id", requestId).eq("source", "campaign-landing-valuation").eq("updated_at", body.updatedAt)
      .select().maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Cette demande a changé ou n’est plus disponible. Actualisez avant de réessayer." }, { status: 409, headers });
    return NextResponse.json({ request: data }, { headers });
  } catch (error) {
    console.error("Failed to save valuation follow-up", error);
    return NextResponse.json({ error: "Impossible d’enregistrer le suivi. Réessayez." }, { status: 500, headers });
  }
}
