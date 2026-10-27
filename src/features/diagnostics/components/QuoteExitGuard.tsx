import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useExitGuard } from "@/hooks/use-exit-guard";

/**
 * Protects unsent quote data. Internal links get a custom confirmation; closing
 * or reloading the tab uses the browser's own prompt, whose text cannot be
 * customized. Must render inside a Router.
 */
export default function QuoteExitGuard({ active }: { active: boolean }) {
  const navigate = useNavigate();
  const [pendingTarget, setPendingTarget] = useState<URL | null>(null);

  useExitGuard({ active, onInternalNavigation: setPendingTarget });

  return (
    <AlertDialog
      open={pendingTarget !== null}
      onOpenChange={(open) => {
        if (!open) setPendingTarget(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair sem enviar a solicitação?</AlertDialogTitle>
          <AlertDialogDescription>
            Você preencheu o formulário de orçamento. Se sair agora, esses dados
            serão descartados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar preenchendo</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (!pendingTarget) return;
              navigate(
                pendingTarget.pathname + pendingTarget.search + pendingTarget.hash,
              );
            }}
          >
            Sair sem enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
