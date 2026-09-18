import DocxPreview from "@/components/DocxPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Eye, Pencil, UserRound } from "lucide-react";

type Props = {
  url: string;
  result: any;
  previewMode: "view" | "edit";
  setPreviewMode: (mode: "view" | "edit") => void;
  updateImprovement: (
    index: number,
    field: string,
    value: string | string[],
  ) => void;
  updateUiuxOverview: (value: string) => void;
  downloadDocx: () => void;
  downloading: boolean;
  downloadBusinessReport: () => void;
  businessDownloading: boolean;
};

export default function DiagnosticPreview({
  url,
  result,
  previewMode,
  setPreviewMode,
  updateImprovement,
  updateUiuxOverview,
  downloadDocx,
  downloading,
  downloadBusinessReport,
  businessDownloading,
}: Props) {
  if (!result) return null;

  return (
    <div>
      <Card className="border-border bg-card p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Eye className="h-4 w-4 text-primary" />
              Preview do relatório (.docx)
            </h3>
            <p className="text-sm text-muted-foreground">
              Visualize o padrão e ajuste textos antes de baixar.
            </p>
          </div>

          <div className="inline-flex rounded-md border border-border bg-secondary p-1">
            <Button
              type="button"
              size="sm"
              variant={previewMode === "view" ? "default" : "ghost"}
              onClick={() => setPreviewMode("view")}
            >
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewMode === "edit" ? "default" : "ghost"}
              onClick={() => setPreviewMode("edit")}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        <div className="-mx-6 -mb-6 overflow-x-auto rounded-b-lg bg-muted/40 px-4 py-8">
          <DocxPreview
            url={url}
            mobile={result.summary.mobile}
            desktop={result.summary.desktop}
            improvements={result.improvements}
            uiux={result.uiux}
            extras={result.extras}
            editable={previewMode === "edit"}
            onImprovementChange={updateImprovement}
            onUiuxOverviewChange={updateUiuxOverview}
          />
        </div>
      </Card>

      <div className="sticky bottom-4 mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          onClick={downloadDocx}
          disabled={downloading}
          size="lg"
          variant="hero"
          className="w-full font-semibold"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <Download className="mr-2 h-5 w-5" />
          Baixar relatório .docx completo
        </Button>
        <Button
          onClick={downloadBusinessReport}
          disabled={businessDownloading}
          size="lg"
          variant="outline"
          className="w-full font-semibold"
        >
          <UserRound className="mr-2 h-5 w-5" />
          {businessDownloading
            ? "Preparando relatório..."
            : "Baixarversão corporativa"}
        </Button>
      </div>
    </div>
  );
}
