import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ModuleCompletedPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 md:ml-56">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-risk-low" aria-hidden="true" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-fg-DEFAULT">Module terminé !</h1>
          <p className="text-fg-muted mt-2">
            Votre progression a été enregistrée. Votre score sera mis à jour cette nuit.
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-risk-low">
          Merci d'avoir participé à votre formation. Chaque module complété renforce la
          sécurité collective de SONABHY.
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/employee/parcours">Voir mes autres modules</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/employee">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
