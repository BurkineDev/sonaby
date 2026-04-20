import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Déconnecter l'utilisateur
  await supabase.auth.signOut();

  // Rediriger vers la page de connexion
  const redirectUrl = new URL("/auth/login", request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
