import { NextRequest, NextResponse } from "next/server";
import { getListDetail } from "@/lib/list";

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string; panel: string } }
) {
  const code = params.code?.trim();
  const panelNum = parseInt(params.panel, 10);

  if (!code) {
    return NextResponse.json({ error: "Code de circonscription manquant." }, { status: 400 });
  }
  if (!params.panel || isNaN(panelNum) || panelNum < 1) {
    return NextResponse.json({ error: "Numéro de panneau invalide." }, { status: 400 });
  }

  try {
    const data = await getListDetail(code, panelNum);
    if (!data) {
      return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/list]", err);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
