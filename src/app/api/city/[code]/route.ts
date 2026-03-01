import { NextRequest, NextResponse } from "next/server";
import { getCityDetail } from "@/lib/city";

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Code de circonscription manquant." }, { status: 400 });
  }

  try {
    const data = await getCityDetail(code);
    if (!data) {
      return NextResponse.json({ error: "Circonscription introuvable." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/city]", err);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
