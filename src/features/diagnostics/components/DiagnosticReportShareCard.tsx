import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type DiagnosticReportShareCardProps = {
  reportUrl: string;
};

export function DiagnosticReportShareCard({
  reportUrl,
}: DiagnosticReportShareCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!copied) return;

    const timeoutId = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const copyReportUrl = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      toast({
        title: "Link copiado com sucesso!",
        description: "O link do relatório está pronto para compartilhar.",
      });
    } catch (error) {
      console.error("Unable to copy the diagnostic report link.", error);
      toast({
        title: "Não foi possível copiar o link",
        description:
          "Confira as permissões do navegador ou copie o endereço exibido manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="space-y-4 border-primary/20 bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Relatório salvo com sucesso
        </h2>
        <p className="text-sm text-muted-foreground">
          Seu diagnóstico está disponível. Você pode acessá-lo novamente ou
          compartilhá-lo com outras pessoas.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Link do relatório
          </p>
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all text-sm text-primary hover:underline"
          >
            {reportUrl}
          </a>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-auto">
          <Button onClick={copyReportUrl}>
            {copied ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? "Link copiado!" : "Copiar link do relatório"}
          </Button>
          <Button asChild variant="outline">
            <a href={reportUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              Abrir relatório salvo
            </a>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Compartilhe este link para permitir que outras pessoas acessem este
        diagnóstico.
      </p>
      {copied && (
        <p role="status" className="text-sm text-primary">
          Link copiado com sucesso!
        </p>
      )}
    </Card>
  );
}
