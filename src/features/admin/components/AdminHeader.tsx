import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import logoColored from "@/assets/logo-colored.png";

type AdminHeaderProps = {
  email?: string;
  onSignOut?: () => void;
};

export function AdminHeader({ email, onSignOut }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Administração"
        className="container flex flex-wrap items-center justify-between gap-4 py-3"
      >
        <Link to="/" aria-label="Metricfly, página inicial" className="flex items-center gap-2.5">
          <img src={logoColored} alt="" className="h-9 w-9 object-contain" />
          <span className="text-lg font-extrabold tracking-tight">Metricfly</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-background">
            Admin
          </span>
          {email && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
          )}
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-lg px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Voltar ao app
          </Link>
          {onSignOut && (
            <Button type="button" variant="outline" onClick={onSignOut}>
              Sair
            </Button>
          )}
          <ThemeToggle inline />
        </div>
      </nav>
    </header>
  );
}
