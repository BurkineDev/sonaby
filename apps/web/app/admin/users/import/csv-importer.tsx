"use client";

/**
 * CsvImporter — Interface d'import CSV utilisateurs SONABHY
 *
 * Workflow en 3 étapes :
 *   1. Upload du fichier CSV + dry-run automatique → rapport de validation
 *   2. Correction éventuelle des erreurs (télécharger le template)
 *   3. Confirmation → import réel
 */

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { importUsers, type ImportResult } from "./actions";
import {
  Upload, Download, CheckCircle2, XCircle, SkipForward,
  AlertCircle, FileText, Loader2, Users,
} from "lucide-react";

const CSV_TEMPLATE = `email,full_name,department_code,job_title,role
alice.sawadogo@sonabhy.bf,Alice Sawadogo,DSI,Analyste Systèmes,user
bob.kabore@sonabhy.bf,Bob Kaboré,RH,Responsable RH,user
carol.tapsoba@sonabhy.bf,Carol Tapsoba,DIRECTION,Directrice Financière,admin`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_import_utilisateurs_sonabhy.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDryRunPending, startDryRun] = useTransition();
  const [isImportPending, startImport] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setGlobalError("Seuls les fichiers .csv sont acceptés");
      return;
    }
    setFile(f);
    setDryRunResult(null);
    setImportResult(null);
    setGlobalError(null);
    // Lancer le dry-run automatiquement
    handleDryRun(f);
  }

  function handleDryRun(f: File) {
    const fd = new FormData();
    fd.set("csv_file", f);
    fd.set("dry_run", "true");

    startDryRun(async () => {
      try {
        const result = await importUsers(fd);
        setDryRunResult(result);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "Erreur lors de la validation");
      }
    });
  }

  function handleConfirmImport() {
    if (!file) return;
    const fd = new FormData();
    fd.set("csv_file", file);
    fd.set("dry_run", "false");

    startImport(async () => {
      try {
        const result = await importUsers(fd);
        setImportResult(result);
        setDryRunResult(null);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "Erreur lors de l'import");
      }
    });
  }

  const isPending = isDryRunPending || isImportPending;
  const finalResult = importResult ?? dryRunResult;

  return (
    <div className="space-y-6">
      {/* Télécharger le template */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">Format CSV attendu</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Colonnes : <code className="bg-blue-100 px-1 rounded">email</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">full_name</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">department_code</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">job_title</code>,{" "}
            <code className="bg-blue-100 px-1 rounded">role</code> (user/admin)
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Le département doit correspondre à un code existant (DSI, RH, COMMERCIAL…).
            Un magic link d'invitation est envoyé automatiquement à chaque nouvel utilisateur.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="shrink-0 gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <Download className="w-3.5 h-3.5" />
          Template
        </Button>
      </div>

      {/* Zone d'upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Sélectionner un fichier CSV"
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
        />
        <Upload
          className="w-10 h-10 text-fg-subtle group-hover:text-primary-500 mx-auto mb-3 transition-colors"
          aria-hidden="true"
        />
        {file ? (
          <div>
            <p className="text-sm font-medium text-fg-DEFAULT">{file.name}</p>
            <p className="text-xs text-fg-subtle mt-1">
              {(file.size / 1024).toFixed(1)} Ko · Cliquer pour changer
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-fg-muted">
              Cliquer ou glisser un fichier CSV
            </p>
            <p className="text-xs text-fg-subtle mt-1">Max 2 Mo</p>
          </div>
        )}
      </div>

      {/* Chargement */}
      {isPending && (
        <div className="flex items-center gap-3 text-sm text-fg-muted bg-bg-subtle rounded-lg p-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isDryRunPending ? "Validation du fichier en cours…" : "Import en cours…"}
        </div>
      )}

      {/* Erreur globale */}
      {globalError && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      {/* Résultat */}
      {finalResult && !isPending && (
        <div className="space-y-4">
          {/* Résumé */}
          <div className={`rounded-xl border p-5 space-y-3 ${
            finalResult.dryRun
              ? "bg-bg-subtle border-border"
              : finalResult.errors > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
          }`}>
            <div className="flex items-center gap-2">
              {!finalResult.dryRun && finalResult.errors === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Users className="w-5 h-5 text-fg-muted" />
              )}
              <h3 className="text-sm font-semibold text-fg-DEFAULT">
                {finalResult.dryRun
                  ? "Rapport de validation (simulation)"
                  : "Résultat de l'import"}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Valides",
                  value: finalResult.valid,
                  color: "text-green-700",
                  bg: "bg-green-100",
                },
                {
                  label: "Erreurs",
                  value: finalResult.errors,
                  color: "text-red-700",
                  bg: "bg-red-100",
                },
                {
                  label: "Ignorés",
                  value: finalResult.skipped,
                  color: "text-amber-700",
                  bg: "bg-amber-100",
                },
              ].map((s) => (
                <div key={s.label} className={`rounded-lg p-3 text-center ${s.bg}`}>
                  <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-fg-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {finalResult.dryRun && finalResult.errors === 0 && (
              <p className="text-sm text-fg-muted">
                ✓ Aucune erreur détectée. {finalResult.valid} utilisateur(s) seront créés.
                Les ignorés sont déjà enregistrés dans cette organisation.
              </p>
            )}
          </div>

          {/* Détail ligne par ligne */}
          {finalResult.rows.length > 0 && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-bg-subtle">
                <p className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Détail ligne par ligne ({finalResult.total} lignes)
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {finalResult.rows.map((row) => (
                      <tr key={row.line} className="px-4 py-2 flex items-center gap-3">
                        <td className="px-4 py-2 font-mono text-fg-subtle w-12 shrink-0">
                          L{row.line}
                        </td>
                        <td className="px-4 py-2 flex-1 text-fg-DEFAULT">{row.email}</td>
                        <td className="px-4 py-2 w-24 shrink-0">
                          {row.status === "ok" && (
                            <span className="flex items-center gap-1 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              OK
                            </span>
                          )}
                          {row.status === "error" && (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-3.5 h-3.5" />
                              Erreur
                            </span>
                          )}
                          {row.status === "skipped" && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <SkipForward className="w-3.5 h-3.5" />
                              Ignoré
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-fg-subtle flex-1 truncate">
                          {row.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bouton de confirmation (dry-run seulement, si pas d'erreurs bloquantes) */}
          {finalResult.dryRun && finalResult.valid > 0 && (
            <div className="flex items-center gap-3 justify-end">
              <p className="text-xs text-fg-subtle">
                {finalResult.errors > 0
                  ? `${finalResult.errors} ligne(s) avec erreurs seront ignorées lors de l'import réel.`
                  : "Toutes les lignes sont valides."}
              </p>
              <Button
                onClick={handleConfirmImport}
                disabled={isImportPending}
                className="gap-2"
              >
                {isImportPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Importer {finalResult.valid} utilisateur(s)
              </Button>
            </div>
          )}

          {/* Succès de l'import réel */}
          {!finalResult.dryRun && finalResult.valid > 0 && (
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {finalResult.valid} utilisateur(s) importé(s) avec succès
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Un email d'invitation (magic link) a été envoyé à chacun. Ils pourront se connecter
                  et compléter leur onboarding dès réception.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
