import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));

  if (q.trim().length < 3) {
    return NextResponse.json(
      { error: "Le paramètre 'q' doit contenir au moins 3 caractères." },
      { status: 400 }
    );
  }

  try {
    const data = await search({ q, page, limit });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
