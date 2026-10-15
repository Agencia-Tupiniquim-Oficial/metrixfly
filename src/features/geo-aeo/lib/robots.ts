export type RobotsAccessStatus =
  | "allowed"
  | "partially-restricted"
  | "blocked"
  | "unverifiable";

export type RobotsDocument = {
  available: boolean;
  url: string;
  content: string | null;
  httpStatus?: number | null;
  contentType?: string | null;
  bytes?: number | null;
  error?: string | null;
};

type RobotsRule = {
  directive: "allow" | "disallow";
  path: string;
};

type RobotsGroup = {
  agents: string[];
  rules: RobotsRule[];
  hasRuleDirective: boolean;
};

const isUniversalPath = (path: string) =>
  path === "/" || path === "/*" || path === "/*$";

export type AgentRobotsResult = {
  agent: string;
  purpose: string;
  status: RobotsAccessStatus;
  explanation: string;
};

export type PlatformRobotsResult = {
  status: RobotsAccessStatus;
  agents: AgentRobotsResult[];
};

export type ContentSignal =
  | "yes"
  | "no"
  | "conflicting"
  | "unspecified"
  | "unverifiable";

export type RobotsVisibility = {
  chatgpt: PlatformRobotsResult;
  gemini: PlatformRobotsResult;
  perplexity: PlatformRobotsResult;
  status: RobotsAccessStatus;
  explanation: string;
  contentSignals: {
    search: ContentSignal;
    aiInput: ContentSignal;
    aiTrain: ContentSignal;
  };
  robotsUrl: string;
  available: boolean;
};

const platforms = {
  chatgpt: [
    { agent: "OAI-SearchBot", purpose: "Busca" },
    { agent: "GPTBot", purpose: "Treinamento" },
  ],
  gemini: [
    { agent: "Googlebot", purpose: "Busca" },
    { agent: "Google-Extended", purpose: "Uso relacionado a IA" },
  ],
  perplexity: [{ agent: "PerplexityBot", purpose: "Busca" }],
} as const;

export function robotsTxtUrlForDomain(
  domain: string | null | undefined,
): string {
  if (!domain?.trim()) return "";
  try {
    const value = domain.trim();
    const base = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL("/robots.txt", base).href;
  } catch {
    return "";
  }
}

function parseGroups(content: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup = {
    agents: [],
    rules: [],
    hasRuleDirective: false,
  };

  const finishGroup = () => {
    if (current.agents.length) groups.push(current);
    current = { agents: [], rules: [], hasRuleDirective: false };
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.split("#", 1)[0].trim();
    if (!line) {
      if (!rawLine.trim().startsWith("#") && current.agents.length) {
        finishGroup();
      }
      continue;
    }

    const userAgent = line.match(/^user-agent\s*:\s*(.*?)\s*$/i);
    if (userAgent) {
      if (current.hasRuleDirective) finishGroup();
      const agent = userAgent[1].trim().toLowerCase();
      if (agent) current.agents.push(agent);
      continue;
    }

    const rule = line.match(/^(allow|disallow)\s*:\s*(.*?)\s*$/i);
    if (rule && current.agents.length) {
      current.hasRuleDirective = true;
      const path = rule[2].trim();
      if (path) {
        current.rules.push({
          directive: rule[1].toLowerCase() as RobotsRule["directive"],
          path,
        });
      }
    }
  }

  finishGroup();
  return groups;
}

function matchingRules(groups: RobotsGroup[], agent: string): RobotsRule[] {
  const normalizedAgent = agent.toLowerCase();
  const specific = groups.filter((group) =>
    group.agents.includes(normalizedAgent),
  );
  const selected =
    specific.length > 0
      ? specific
      : groups.filter((group) => group.agents.includes("*"));
  return selected.flatMap((group) => group.rules);
}

function assessAgent(
  groups: RobotsGroup[],
  agent: string,
  purpose: string,
): AgentRobotsResult {
  const rules = matchingRules(groups, agent);
  const allows = rules.filter((rule) => rule.directive === "allow");
  const disallows = rules
    .filter(
      (rule) =>
        rule.directive === "disallow" &&
        !allows.some(
          (allow) =>
            allow.path === rule.path ||
            (rule.path === "/" &&
              (allow.path === "/*" || allow.path === "/*$")),
        ),
    );
  const fullSiteBlock = disallows.find((rule) => isUniversalPath(rule.path));

  if (fullSiteBlock && allows.length === 0) {
    return {
      agent,
      purpose,
      status: "blocked",
      explanation: `Bloqueado por Disallow: ${fullSiteBlock.path}.`,
    };
  }

  if (disallows.length) {
    const rule = disallows[0];
    const exception = fullSiteBlock
      ? ` Há exceção de acesso por Allow: ${allows[0].path}.`
      : "";
    return {
      agent,
      purpose,
      status: "partially-restricted",
      explanation: `A regra Disallow: ${rule.path} restringe os caminhos correspondentes.${exception}`,
    };
  }

  const allow = allows[0];
  return {
    agent,
    purpose,
    status: "allowed",
    explanation: allow
      ? `Sem bloqueios aplicáveis; Allow: ${allow.path} permite o caminho correspondente.`
      : "Nenhuma regra Disallow aplicável; permitido por padrão.",
  };
}

function assessPlatform(agents: AgentRobotsResult[]): PlatformRobotsResult {
  const statuses = new Set(agents.map(({ status }) => status));
  const status: RobotsAccessStatus =
    statuses.size === 1
      ? agents[0].status
      : statuses.has("unverifiable")
        ? "unverifiable"
        : "partially-restricted";
  return { status, agents };
}

function parseContentSignals(content: string): RobotsVisibility["contentSignals"] {
  const values: Record<"search" | "ai-input" | "ai-train", Set<string>> = {
    search: new Set(),
    "ai-input": new Set(),
    "ai-train": new Set(),
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.split("#", 1)[0].trim();
    const directive = line.match(/^content-signal\s*:\s*(.*)$/i);
    if (!directive) continue;
    for (const signal of directive[1].matchAll(
      /\b(search|ai-input|ai-train)\s*=\s*(yes|no)\b/gi,
    )) {
      values[signal[1].toLowerCase() as keyof typeof values].add(
        signal[2].toLowerCase(),
      );
    }
  }

  const value = (signal: keyof typeof values): ContentSignal => {
    const declarations = values[signal];
    if (declarations.size > 1) return "conflicting";
    return declarations.size === 1
      ? (declarations.values().next().value as "yes" | "no")
      : "unspecified";
  };

  return {
    search: value("search"),
    aiInput: value("ai-input"),
    aiTrain: value("ai-train"),
  };
}

export function analyzeRobotsTxt(
  document: RobotsDocument | null | undefined,
  domain?: string | null,
): RobotsVisibility {
  const robotsUrl =
    (document?.url && /^https?:\/\//i.test(document.url)
      ? document.url
      : robotsTxtUrlForDomain(domain));
  const content = document?.content ?? "";
  const isHtmlFallback =
    /^\uFEFF?\s*(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i.test(
      content,
    );
  if (document?.content == null || isHtmlFallback) {
    const unavailable = (agent: string, purpose: string): AgentRobotsResult => ({
      agent,
      purpose,
      status: "unverifiable",
      explanation: "Não foi possível consultar o robots.txt; acesso não presumido.",
    });
    return {
      chatgpt: assessPlatform([
        unavailable("OAI-SearchBot", "Busca"),
        unavailable("GPTBot", "Treinamento"),
      ]),
      gemini: assessPlatform([
        unavailable("Googlebot", "Busca"),
        unavailable("Google-Extended", "Uso relacionado a IA"),
      ]),
      perplexity: assessPlatform([unavailable("PerplexityBot", "Busca")]),
      status: "unverifiable",
      explanation:
        document?.error ??
        "Não foi possível obter o conteúdo do robots.txt para interpretar as regras.",
      contentSignals: {
        search: "unverifiable",
        aiInput: "unverifiable",
        aiTrain: "unverifiable",
      },
      robotsUrl,
      available: false,
    };
  }

  const groups = parseGroups(content);
  const result = Object.fromEntries(
    Object.entries(platforms).map(([platform, agents]) => [
      platform,
      assessPlatform(
        agents.map(({ agent, purpose }) =>
          assessAgent(groups, agent, purpose),
        ),
      ),
    ]),
  ) as Pick<RobotsVisibility, "chatgpt" | "gemini" | "perplexity">;
  const agents = [
    ...result.chatgpt.agents,
    ...result.gemini.agents,
    ...result.perplexity.agents,
  ];
  const restricted = agents.filter(
    ({ status }) => status === "blocked" || status === "partially-restricted",
  );
  const status: RobotsAccessStatus =
    restricted.length === 0
      ? "allowed"
      : restricted.length === agents.length &&
          restricted.every(({ status }) => status === "blocked")
        ? "blocked"
        : "partially-restricted";
  const explanation =
    status === "allowed"
      ? "Nenhuma regra Disallow aplicável foi encontrada para os agentes avaliados; o acesso é permitido por padrão."
      : restricted
          .map(({ explanation: ruleExplanation }) => ruleExplanation)
          .filter((ruleExplanation, index, rules) => rules.indexOf(ruleExplanation) === index)
          .join(" ");

  return {
    ...result,
    status,
    explanation,
    contentSignals: parseContentSignals(content),
    robotsUrl,
    available: true,
  };
}
