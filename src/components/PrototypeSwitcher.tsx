import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VariantInfo = {
  key: string;
  name: string;
  description?: string;
};

type PrototypeSwitcherProps = {
  variants: VariantInfo[];
  current: string;
  onSelectVariant?: (key: string) => void;
  hasSampleData?: boolean;
  onToggleSampleData?: () => void;
};

export function PrototypeSwitcher({
  variants,
  current,
  onSelectVariant,
  hasSampleData,
  onToggleSampleData,
}: PrototypeSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hidden in production builds
  if (import.meta.env.PROD) {
    return null;
  }

  const currentIndex = variants.findIndex(
    (v) => v.key.toUpperCase() === current.toUpperCase()
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeVariant = variants[activeIndex] || variants[0];

  const goToVariant = (nextKey: string) => {
    if (onSelectVariant) {
      onSelectVariant(nextKey);
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set("variant", nextKey);
    setSearchParams(newParams, { replace: true });
  };

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + variants.length) % variants.length;
    goToVariant(variants[prevIndex].key);
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % variants.length;
    goToVariant(variants[nextIndex].key);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept arrow keys when typing in an input, textarea or contenteditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, variants, searchParams]);

  return (
    <aside
      aria-label="Controle de protótipo UI"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/95 text-slate-100 shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all select-none"
      style={{
        boxShadow:
          "0 10px 30px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="flex items-center gap-1.5 pl-2.5 pr-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
        <Layers className="w-3.5 h-3.5" />
        <span>Protótipo</span>
      </div>

      <div className="h-4 w-px bg-slate-700 mx-0.5" />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handlePrev}
        title="Variante anterior (ou use a tecla ←)"
        className="h-7 w-7 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Anterior</span>
      </Button>

      <div className="flex items-center gap-1 px-1.5">
        {variants.map((v, i) => {
          const isSelected = i === activeIndex;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => goToVariant(v.key)}
              title={`${v.key}: ${v.name}${v.description ? ` - ${v.description}` : ""}`}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                isSelected
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <span className="font-semibold">{v.key}</span>
              <span className="hidden sm:inline ml-1 font-normal opacity-90">
                · {v.name}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleNext}
        title="Próxima variante (ou use a tecla →)"
        className="h-7 w-7 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima</span>
      </Button>

      {onToggleSampleData && (
        <>
          <div className="h-4 w-px bg-slate-700 mx-0.5" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleSampleData}
            title="Alternar dados de exemplo para avaliar o design populado"
            className={`h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
              hasSampleData
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
            {hasSampleData ? "Demo ativa" : "Carregar demo"}
          </Button>
        </>
      )}

      <span className="hidden lg:inline text-[10px] text-slate-400 pr-2 pl-0.5">
        (atalhos: ← / →)
      </span>
    </aside>
  );
}
