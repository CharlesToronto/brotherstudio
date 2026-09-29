import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "dashboard-request-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Impossible d’enregistrer le PDF.";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Le document doit être un PDF." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Le PDF doit faire 10 Mo maximum." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: current, error: currentError } = await supabase
      .from("dashboard_projects")
      .select("request_pdf_url")
      .eq("id", projectId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const path = `${projectId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: "application/pdf",
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("dashboard_projects")
      .update({ request_pdf_url: publicUrl.publicUrl, request_pdf_name: file.name })
      .eq("id", projectId);
    if (updateError) throw updateError;

    const previousUrl = typeof current.request_pdf_url === "string" ? current.request_pdf_url : "";
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const previousPath = previousUrl.includes(marker) ? previousUrl.split(marker)[1] : "";
    if (previousPath) await supabase.storage.from(BUCKET).remove([previousPath]);

    return NextResponse.json({ url: publicUrl.publicUrl, name: file.name });
  } catch (error) {
    console.error("Failed to upload dashboard request document", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
