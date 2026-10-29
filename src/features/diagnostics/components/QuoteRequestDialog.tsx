import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { useInRouterContext } from "react-router-dom";
import QuoteExitGuard from "@/features/diagnostics/components/QuoteExitGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type {
  QuoteRequest,
  ServiceInterest,
} from "@/features/diagnostics/model/quote-request";

type Props = {
  onSubmitRequest: (request: QuoteRequest) => Promise<void>;
  sending?: boolean;
  /** Service-specific calls to action set this; the general button leaves it unset. */
  serviceInterest?: ServiceInterest;
  /** Called when the visitor opens the dialog (interest signal, not a submission). */
  onOpened?: (interest: ServiceInterest) => void;
  triggerLabel?: string;
  /** Lets a colored surface restyle the trigger (e.g. the closing band). */
  triggerClassName?: string;
  /** Controlled mode: the caller opens and closes the dialog (e.g. from another button). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** False when another button opens the dialog. */
  showTrigger?: boolean;
};

export default function QuoteRequestDialog({
  onSubmitRequest,
  sending = false,
  serviceInterest,
  onOpened,
  triggerLabel = "Solicitar orçamento",
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [request, setRequest] = useState<QuoteRequest>({
    "form-name": "form-contato",
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const insideRouter = useInRouterContext();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setRequest((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);
    const formName = formData.get("form-name");
    if (formName !== "form-contato") {
      setErrorMessage("Não foi possível validar a solicitação. Atualize a página e tente novamente.");
      return;
    }
    try {
      await onSubmitRequest({
        "form-name": formName,
        name: String(formData.get("name") ?? "").trim(),
        company: String(formData.get("company") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        ...(serviceInterest && serviceInterest !== "general"
          ? { serviceInterest }
          : {}),
      });
      setOpen(false);
      setRequest({
        "form-name": "form-contato",
        name: "",
        company: "",
        email: "",
        phone: "",
      });
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Nossa equipe entrará em contato.",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação. Tente novamente.",
      );
    }
  };

  const hasUnsentData = [
    request.name,
    request.company,
    request.email,
    request.phone,
  ].some((value) => value.trim() !== "");

  // A controlled dialog opens without a click inside it, so the interest signal is sent here.
  useEffect(() => {
    if (isControlled && controlledOpen) onOpened?.(serviceInterest ?? "general");
    // Only the moment it opens counts, not later renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, controlledOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !open && !isControlled) onOpened?.(serviceInterest ?? "general");
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {insideRouter && <QuoteExitGuard active={hasUnsentData} />}
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className={cn("w-full font-semibold", triggerClassName)}
          >
            <Mail className="mr-2 h-5 w-5" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar orçamento</DialogTitle>
          <DialogDescription>
            Informe seus dados. O domínio e as informações do diagnóstico serão
            incluídos automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="form-name" value={request["form-name"]} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              name="name"
              aria-label="Nome"
              placeholder="Nome"
              value={request.name}
              onChange={handleChange}
              required
            />
            <Input
              name="company"
              aria-label="Empresa"
              placeholder="Empresa"
              value={request.company}
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              aria-label="E-mail"
              type="email"
              placeholder="E-mail"
              value={request.email}
              onChange={handleChange}
              required
            />
            <Input
              name="phone"
              aria-label="Telefone"
              type="tel"
              placeholder="Telefone"
              value={request.phone}
              onChange={handleChange}
              required
            />
          </div>
          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {sending ? "Enviando solicitação..." : "Enviar solicitação de orçamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
