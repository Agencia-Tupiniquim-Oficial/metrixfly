import DocxPreview from "@/components/DocxPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Eye, Pencil } from "lucide-react";

type Props = {
  url: string;
  result: any;
  previewMode: "view" | "edit";
  setPreviewMode: (m: "view" | "edit") => void;
  updateImprovement: (index: number, field: string, value: string) => void;
  updateUiuxOverview: (v: string) => void;
  downloadDocx: () => void;
};

export default function DiagnosticPreview({ url, result, previewMode, setPreviewMode, updateImprovement, updateUiuxOverview, downloadDocx }: Props) {
  if (!result) return null;
  return (
    <div>
      <Card className="p-6 bg-card border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Preview do relatório (.docx)
            </h3>
            <p className="text-sm text-muted-foreground">Visualize o padrão e ajuste textos antes de baixar.</p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-secondary p-1">
            <Button type="button" size="sm" variant={previewMode === "view" ? "default" : "ghost"} onClick={() => setPreviewMode("view")}>
              <Eye className="w-4 h-4" /> Visualizar
            </Button>
            <Button type="button" size="sm" variant={previewMode === "edit" ? "default" : "ghost"} onClick={() => setPreviewMode("edit")}>
              <Pencil className="w-4 h-4" /> Editar
            </Button>
          </div>
        </div>
        <div className="bg-muted/40 -mx-6 -mb-6 px-4 py-8 rounded-b-lg overflow-x-auto">
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
      <div className="sticky bottom-4 mt-4">
        <Button onClick={downloadDocx} size="lg" variant="hero" className="w-full font-semibold" style={{ boxShadow: "var(--shadow-glow)" }}>
          <Download className="w-5 h-5 mr-2" /> Baixar relatório .docx completo
        </Button>
      </div>
    </div>
  );
}
