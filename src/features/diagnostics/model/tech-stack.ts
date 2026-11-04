import type {
  TechStack,
  TechStackItem,
} from "@/features/diagnostics/model/diagnose";

export type TechStackGroup = {
  label: string;
  items: string[];
};

// Categorias do Stackfly (Wappalyzer, em ingles) agrupadas em rotulos do relatorio.
// Cada tecnologia entra apenas no primeiro grupo que corresponder, nesta ordem.
const TECH_STACK_GROUPS: { label: string; categories: string[] }[] = [
  { label: "Plataforma", categories: ["CMS", "Ecommerce", "Blogs", "Static site generator", "Website builders"] },
  { label: "Construtor visual", categories: ["Page builders"] },
  { label: "Cache e entrega de conteúdo", categories: ["Caching", "CDN", "Performance"] },
  { label: "Plugins e temas", categories: ["WordPress plugins", "WordPress themes", "Shopify apps", "Wix apps"] },
  { label: "Servidor e hospedagem", categories: ["Web servers", "Reverse proxies", "PaaS", "IaaS", "Hosting", "Operating systems"] },
  { label: "Linguagens e banco de dados", categories: ["Programming languages", "Databases"] },
  { label: "Frameworks e bibliotecas", categories: ["JavaScript frameworks", "JavaScript libraries", "UI frameworks", "Web frameworks", "Font scripts"] },
  { label: "Análise e marketing", categories: ["Analytics", "Tag managers", "Marketing automation", "Advertising", "Live chat", "Customer data platform", "Retargeting"] },
  { label: "Segurança", categories: ["Security", "SSL/TLS certificate authorities", "Cookie compliance"] },
];

const OTHER_GROUP_LABEL = "Outras tecnologias";

const matchesCategory = (item: TechStackItem, categories: string[]) =>
  item.categories.some((category) =>
    categories.some((current) => current.toLowerCase() === category.toLowerCase()),
  );

export const formatTechStackItem = (item: TechStackItem) =>
  item.version ? `${item.name} ${item.version}` : item.name;

/** Agrupa as tecnologias para o relatorio na tela e no PDF (mesma ordem nos dois). */
export function groupTechStack(stack: TechStack | null | undefined): TechStackGroup[] {
  const technologies = stack?.technologies ?? [];
  const groups = new Map<string, string[]>();

  for (const item of technologies) {
    const group = TECH_STACK_GROUPS.find(({ categories }) => matchesCategory(item, categories));
    const label = group?.label ?? OTHER_GROUP_LABEL;
    const items = groups.get(label) ?? [];
    items.push(formatTechStackItem(item));
    groups.set(label, items);
  }

  return [...TECH_STACK_GROUPS.map(({ label }) => label), OTHER_GROUP_LABEL]
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label) ?? [] }));
}

export function hasTechStack(stack: TechStack | null | undefined): stack is TechStack {
  return Boolean(stack && Array.isArray(stack.technologies) && stack.technologies.length > 0);
}
