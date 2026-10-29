---
name: metrixfly-design
description: "Use when a Metrixfly request changes how a screen looks or feels: new section, layout, animation, spacing, responsiveness or theme. Evaluates the best way to apply it before any code is written."
---

# Avaliacao de design no Metrixfly

Use antes de implementar qualquer pedido visual, junto com `AGENTS.md` e `docs/agents/INSTRUCOES.md`. Esta skill decide COMO aplicar; a implementacao segue `metrixfly-implementation`. Em telas novas ou grandes, delegue a analise ao subagente `metrixfly-design-review`.

## Procedimento

1. Reescreva o pedido como resultado visual observavel (o que o usuario ve e faz). Se houver imagem de referencia, extraia a ideia (estrutura, ritmo, animacao) e nunca copie arte, texto ou marca de terceiros; crie elementos originais com a identidade do Metrixfly.
2. Leia a pagina e os componentes vizinhos: tokens em `src/index.css` e `tailwind.config.ts`, componentes de `src/components/ui`, `score-ring`, e secoes parecidas em `src/features/<dominio>`. Reaproveite antes de criar.
3. Avalie o desenho contra a lista abaixo e escolha a menor solucao que a satisfaz.
   - **Espaco:** nenhuma coluna ou area vazia no desktop; o conteudo ocupa a largura com equilibrio.
   - **Hierarquia:** um foco por secao, titulo claro, ritmo de espacamento igual ao das secoes vizinhas.
   - **Responsividade:** 320, 360, 390 e 768 px sem rolagem horizontal; elementos decorativos podem sumir no celular, o conteudo nao.
   - **Tema:** claro e escuro, usando tokens (`bg-card`, `text-muted-foreground`, `primary`), sem cores soltas.
   - **Movimento:** animacao com funcao (guiar, dar feedback), discreta, em CSS; respeita `prefers-reduced-motion` (a regra global esta em `src/index.css`); sem custo de layout.
   - **Acessibilidade:** ilustracao decorativa com `aria-hidden`, contraste, foco visivel, alvos de toque confortaveis, controles por teclado.
   - **Texto:** copy e promessa comercial sao decisao do usuario (nivel C em `GOVERNANCA.md`); proponha, nao afirme precos, prazos ou resultados que o projeto nao define. Respeite os testes que proibem promessas (ver `src/test/HomePage.test.tsx`).
4. Registre a proposta em poucas linhas: layout, componentes reaproveitados, animacoes, riscos e o que fica para validacao manual. Se houver duas direcoes reais, pergunte; se houver uma boa, siga.
5. Implemente conforme `metrixfly-implementation`. Como nao ha navegador no ambiente, use o procedimento de responsividade de `docs/agents/LEARNINGS.md` quando a auditoria for necessaria, ou peca ao usuario para validar no preview da Vercel.
6. No relatorio final, diga o que nao foi visto em tela e liste o que o usuario deve conferir (celular, tema escuro, animacao).

Nao altere banco, segredos ou servicos externos, e nao faca commit, push, merge ou deploy sem autorizacao explicita.
