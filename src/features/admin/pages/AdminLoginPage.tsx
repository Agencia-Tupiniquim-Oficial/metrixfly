import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { useAdminSession, useNoIndex } from "@/features/admin/hooks/use-admin-session";
import { requestAdminLink } from "@/features/admin/services/admin-api";

export default function AdminLoginPage() {
  useNoIndex();
  const session = useAdminSession();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (session.status === "signed-in") return <Navigate to="/admin" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setErrorMessage(null);
    try {
      await requestAdminLink(email);
      setSentTo(email.trim());
    } catch (error) {
      console.error("Unable to send the admin sign-in link", error);
      // The message does not say whether the e-mail is registered.
      setErrorMessage(
        "Não foi possível enviar o link agora. Confira o e-mail ou tente novamente em instantes.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <AdminHeader />
      <main className="container max-w-md py-16">
        <Card
          className="space-y-6 border-border bg-card p-8"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Área da agência
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">Entrar</h1>
            <p className="text-sm text-muted-foreground">
              Informe o e-mail da agência. Enviaremos um link de acesso, sem senha.
            </p>
          </div>

          {sentTo ? (
            <div role="status" className="space-y-1 rounded-xl bg-primary/10 p-4 text-sm">
              <p className="font-semibold text-foreground">Confira a sua caixa de entrada</p>
              <p className="text-muted-foreground">
                Se {sentTo} tiver acesso, o link de entrada chega em instantes.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">E-mail da agência</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@agencia.com.br"
                  required
                  disabled={sending}
                />
              </div>
              {errorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" size="lg" variant="hero" className="w-full" disabled={sending}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Enviar link de acesso
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
