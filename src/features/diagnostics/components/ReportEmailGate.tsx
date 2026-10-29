import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeLeadEmail } from "@/features/diagnostics/model/report-lead";

type Props = {
  open: boolean;
  domain: string;
  /** Receives the valid e-mail; the report is released when it resolves. */
  onSubmit: (email: string) => Promise<void>;
};

/** Cannot be dismissed: the report stays blurred until an e-mail is given. */
export default function ReportEmailGate({ open, domain, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const valid = normalizeLeadEmail(email);
    if (!valid) {
      setError("Informe um e-mail válido para ver o relatório.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await onSubmit(valid);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="space-y-3 text-left">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Mail aria-hidden="true" className="h-6 w-6 text-primary" />
          </span>
          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            Seu relatório está pronto
          </DialogTitle>
          <DialogDescription>
            {domain ? `O diagnóstico de ${domain} foi gerado. ` : ""}
            Coloque seu e-mail para visualizar o relatório completo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            aria-label="Seu e-mail"
            aria-invalid={error ? true : undefined}
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            disabled={sending}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={sending}>
            {sending ? (
              <>
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> Liberando…
              </>
            ) : (
              "Ver meu relatório"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Usamos o e-mail apenas para liberar o relatório. Ele fica registrado junto
            com o site analisado.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
