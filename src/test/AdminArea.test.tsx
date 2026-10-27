import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLoginPage from "@/features/admin/pages/AdminLoginPage";
import AdminPage from "@/features/admin/pages/AdminPage";
import { filterAnalyses, type AdminAnalysis } from "@/features/admin/services/admin-api";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithOtp: mocks.signInWithOtp,
      signOut: mocks.signOut,
    },
    rpc: mocks.rpc,
  },
}));

const rows = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    domain: "https://loja-exemplo.com.br/",
    created_at: "2026-10-27T15:55:00.000Z",
    mobile_score: 86,
    desktop_score: 100,
    quote_opened: 2,
    quote_submitted: 1,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    domain: "https://clinica-exemplo.com.br/",
    created_at: "2026-10-26T10:12:00.000Z",
    mobile_score: 31,
    desktop_score: 70,
    quote_opened: 1,
    quote_submitted: 0,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    domain: null,
    created_at: "2026-10-25T09:00:00.000Z",
    mobile_score: null,
    desktop_score: null,
    quote_opened: 0,
    quote_submitted: 0,
  },
];

function signedIn(email = "suporte@agenciatupiniquim.com.br") {
  mocks.getSession.mockResolvedValue({ data: { session: { user: { email } } } });
}

function renderAdmin(path = "/admin") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/" element={<p>pagina inicial</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Agency admin area", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.rpc.mockResolvedValue({ data: rows, error: null });
  });

  it("sends a visitor without a session to the login page", async () => {
    renderAdmin("/admin");

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("lists the analyses with score, quote status and a link to the report", async () => {
    signedIn();
    renderAdmin();

    expect(await screen.findByText("https://loja-exemplo.com.br/")).toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith("admin_list_analyses", { limit_rows: 200 });
    expect(screen.getByText("suporte@agenciatupiniquim.com.br")).toBeInTheDocument();
    expect(screen.getByText(/3 análises salvas · 1 pedido de orçamento/)).toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(within(table).getByText("Pediu orçamento")).toBeInTheDocument();
    expect(within(table).getByText("Abriu o formulário")).toBeInTheDocument();
    expect(within(table).getByText("Endereço não informado")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir o relatório de https://loja-exemplo.com.br/" }),
    ).toHaveAttribute("href", "/diagnostico/11111111-1111-4111-8111-111111111111");
  });

  it("filters the analyses by domain", async () => {
    signedIn();
    renderAdmin();
    await screen.findByText("https://loja-exemplo.com.br/");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar domínio" }), {
      target: { value: "clinica" },
    });

    expect(screen.queryByText("https://loja-exemplo.com.br/")).not.toBeInTheDocument();
    expect(screen.getByText("https://clinica-exemplo.com.br/")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar domínio" }), {
      target: { value: "nada" },
    });
    expect(screen.getByText("Nenhum domínio encontrado para essa busca.")).toBeInTheDocument();
  });

  it("tells a signed-in account that is not on the allowlist it has no access", async () => {
    signedIn("outra@pessoa.com");
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "not_authorized" },
    });
    renderAdmin();

    expect(await screen.findByRole("heading", { name: "Sem acesso" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows other failures with a retry instead of an empty list", async () => {
    signedIn();
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "XX000", message: "falha de rede" } });
    renderAdmin();

    expect(await screen.findByText("falha de rede")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("https://loja-exemplo.com.br/")).toBeInTheDocument();
  });

  it("signs out from the header", async () => {
    signedIn();
    renderAdmin();
    await screen.findByText("https://loja-exemplo.com.br/");

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
  });

  it("asks the agency e-mail for a link without creating accounts", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    renderAdmin("/admin/login");

    fireEvent.change(await screen.findByLabelText("E-mail da agência"), {
      target: { value: " Suporte@AgenciaTupiniquim.com.br " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link de acesso" }));

    expect(await screen.findByText("Confira a sua caixa de entrada")).toBeInTheDocument();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "suporte@agenciatupiniquim.com.br",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
  });

  it("does not say whether an e-mail is registered when sending fails", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: { message: "Signups not allowed for otp" } });
    renderAdmin("/admin/login");

    fireEvent.change(await screen.findByLabelText("E-mail da agência"), {
      target: { value: "desconhecido@exemplo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link de acesso" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível enviar o link agora");
    expect(alert).not.toHaveTextContent(/Signups|registrado|cadastrado/i);
  });

  it("sends an already signed-in visitor from the login page to the list", async () => {
    signedIn();
    renderAdmin("/admin/login");

    expect(await screen.findByText(/análises salvas/)).toBeInTheDocument();
  });
});

describe("filterAnalyses", () => {
  const analyses = [
    { domain: "https://Loja.com.br/" },
    { domain: "https://clinica.com.br/" },
  ] as AdminAnalysis[];

  it("matches without caring about case and returns everything for a blank term", () => {
    expect(filterAnalyses(analyses, "LOJA")).toHaveLength(1);
    expect(filterAnalyses(analyses, "  ")).toHaveLength(2);
  });
});
