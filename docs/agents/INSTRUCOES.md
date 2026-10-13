# Instruções de Operação (Modus Operandi)

Sempre que receber uma tarefa, este é o loop de trabalho obrigatório:

1. **ENTENDER (Contexto)**:
   - Leia `docs/agents/PLANO.md` para entender onde estamos no projeto.
   - Use `grep` ou `xd://lsp` para identificar arquivos e componentes impactados antes de qualquer edição.

2. **PLANEJAR (Update)**:
   - Se a tarefa for complexa, quebre-a em subtarefas no `docs/agents/PLANO.md`.
   - Se a tarefa já estiver no plano, verifique se não há dependências pendentes.

3. **EXECUTAR (Ação)**:
   - Aplique as mudanças mantendo a consistência do estilo do projeto (React/Tailwind/TypeScript).

4. **VALIDAR (Prova)**:
   - Rode os testes (`npm test`) e, para alterações de estrutura ou configuração, também o build (`npm run build`).
   - Verifique visualmente os componentes alterados (se aplicável).

5. **REPORTAR (Estado)**:
   - Atualize `docs/agents/PLANO.md`, marcando os itens concluídos.

### Regras de Ouro:
- Nunca assuma; verifique os tipos do domínio em `src/features/<dominio>/model/`.
- Em caso de dúvida sobre integrações Supabase, consulte `src/integrations/supabase/client.ts`.
- Se algo quebrar, PARE e reporte imediatamente.
