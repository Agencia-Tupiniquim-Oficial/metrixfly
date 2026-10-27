import { Link, NavLink } from "react-router-dom";
import logoColored from "@/assets/logo-colored.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { to: "/diagnostico", label: "Diagnóstico" },
  { to: "/geo-aeo", label: "GEO/AEO" },
];

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background">
      <nav
        aria-label="Principal"
        className="container flex flex-wrap items-center justify-between gap-4 py-3"
      >
        <Link to="/" aria-label="Metricfly, página inicial" className="flex items-center gap-2.5">
          <img src={logoColored} alt="" className="h-9 w-9 object-contain" />
          <span className="text-lg font-extrabold tracking-tight">Metricfly</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3.5 text-sm",
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "font-medium text-muted-foreground hover:text-foreground",
                )
              }
            >
              {label}
            </NavLink>
          ))}
          <ThemeToggle inline />
        </div>
      </nav>
    </header>
  );
}
