import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ValuationRequest } from "@/lib/valuationRequests";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "Connexion administrateur requise." }, { status: 401, headers });
    }
    const client = getSupabaseAdminClient();
    const requests: ValuationRequest[] = [];
    // Read every page rather than silently truncating at the Data API row limit.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from("property_valuation_requests")
        .select("id,first_name,last_name,email,phone,property_type,property_address,room_count,approximate_area,contact_time,sale_timeline,desired_price_chf,created_at,status,notes,next_follow_up,updated_at")
        .eq("source", "campaign-landing-valuation")
        .order("created_at", { ascending: false }).order("id")
        .range(offset, offset + 499);
      if (error) throw error;
      requests.push(...(data as ValuationRequest[]));
      if (data.length < 500) break;
    }
    return NextResponse.json({ requests }, { headers });
  } catch (error) {
    console.error("Failed to load property valuation requests", error);
    return NextResponse.json({ error: "Impossible de charger les demandes. Réessayez." }, { status: 500, headers });
  }
}
