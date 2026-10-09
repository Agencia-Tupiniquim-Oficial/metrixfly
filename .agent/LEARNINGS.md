# Memória de Aprendizado do Metrixfly (LEARNINGS.md)

Este arquivo serve como a memória de longo prazo do agente. Aqui registramos padrões, restrições, lições aprendidas e comportamentos específicos do sistema que não devem ser esquecidos.

## Registro de Lições
*   **Data | Tópico | Lição Aprendida**
*   2026-10-09 | Infraestrutura | O projeto não utiliza Docker; toda automação deve ser feita via scripts `npm` ou shell scripts locais.
*   2026-10-09 | Tipagem | Proibido uso de `any`. Sempre utilizar `satisfies DiagnoseResult` ou definições de tipo explícitas.
*   2026-10-09 | Governança | Toda alteração de comportamento deve ser refletida no `PLANO.md` e, se relevante, documentada aqui.

## Padrões de Código
*   ... (Espaço para registrar refatorações futuras que não devem ser revertidas)

## Dicas de Depuração
*   ... (Ex: "Sempre limpar o cache do Supabase se o relatório não atualizar")

---
*Instrução para a IA: Ao iniciar qualquer tarefa, leia este arquivo. Se você descobrir uma nova regra ou limitação técnica, adicione-a aqui imediatamente.*
