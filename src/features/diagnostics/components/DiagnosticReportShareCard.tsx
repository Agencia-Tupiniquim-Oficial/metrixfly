import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
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
    <Card className="flex flex-wrap items-center justify-between gap-5 border-border bg-card px-6 py-5 md:px-7">
      <div className="flex min-w-0 flex-1 basis-72 flex-col gap-0.5">
        <h2 className="text-lg font-extrabold text-foreground">
          Relatório salvo com sucesso
        </h2>
        <p className="text-sm text-muted-foreground">
          Qualquer pessoa com o link pode abrir.{" "}
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Ver como o cliente vê
          </a>
        </p>
      </div>

      <div className="flex min-w-0 flex-1 basis-96 items-center gap-2 rounded-xl border border-border bg-muted/40 py-1.5 pl-3.5 pr-1.5">
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {reportUrl}
        </a>
        <Button
          onClick={copyReportUrl}
          aria-label={copied ? "Link copiado!" : "Copiar link do relatório"}
          className="shrink-0 bg-foreground text-background hover:bg-foreground/90"
        >
          {copied ? (
            <Check aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {copied ? "Copiado!" : "Copiar link"}
        </Button>
      </div>

      {copied && (
        <p role="status" className="basis-full text-sm text-primary">
          Link copiado com sucesso!
        </p>
      )}
    </Card>
  );
}
