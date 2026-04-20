import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf les assets statiques et les métadonnées Next.js.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|sw.js|workbox-.*).*)",
  ],
};
