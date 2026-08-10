# TODO - Melhorias de UI/UX (Flexbox, Dicas e Transições)

## Passos (concluídos)
- [x] 1. Analisar o projeto e montar o plano (aprovado)
- [x] 2. Adicionar transições suaves (slide/fade) no `app/_layout.tsx` (Stack)
- [x] 3. Adicionar transição fade nas Tabs em `app/(tabs)/_layout.tsx`
- [x] 4. Corrigir responsividade do grid de resumo em `app/(tabs)/relatorios.tsx`
- [x] 5. Corrigir responsividade da grade de meses no modal de `relatorios.tsx`
- [x] 6. Tornar o gráfico "Gastos por Categoria" responsivo em `src/componentes/GastosPorCategoria.tsx`
- [x] 7. Adicionar `flexShrink` no `src/componentes/BalanceCard.tsx`
- [x] 8. Reescrever a seção "Curso Rápido" em `app/(tabs)/dicas.tsx` com conteúdo melhor
- [x] 9. Adicionar `flexShrink`/ajustes de responsividade em `dicas.tsx`
- [x] 10. Rodar `npx tsc --noEmit` para checar tipos

## Dependências / Arquivos editados (anteriores)
- app/_layout.tsx
- app/(tabs)/_layout.tsx
- app/(tabs)/dicas.tsx
- app/(tabs)/relatorios.tsx
- src/componentes/GastosPorCategoria.tsx
- src/componentes/BalanceCard.tsx

---

# NOVOS AJUSTES (aprovados)

## 1. 🔔 Sistema de Notificações
- [x] Criar tabela `notificacoes` no Supabase (SQL + RLS) em `supabase/notificacoes.sql`
- [x] Criar API `src/api/notificacoesApi.ts` (listar, criar, marcar lida, excluir)
- [x] Criar contexto `src/contextos/NotificacoesContexto.tsx` (carrega notificações, marca lida, gera automáticas)
- [x] Criar componente modal `src/componentes/NotificacoesModal.tsx` (lista das notificações)
- [x] Envolver app com `NotificacoesProvider` em `_layout.tsx`
- [x] Ligar `Cabecalho` (sino) ao contexto (contador + abertura do modal)
- [x] Gerar notificações automáticas: meta concluída, despesa acima da receita, dicas, boas-vindas

## 2. 📚 Tela de Dicas (cards clicáveis)
- [x] Remover seção "Curso Rápido" (`LICOES` + renderização) de `app/(tabs)/dicas.tsx`
- [x] Adicionar campo de conteúdo detalhado/didático a cada `Dica`
- [x] Tornar os cards de `DICAS` clicáveis abrindo um modal com explicação detalhada

## 3. ⚙️ Limite de exibição na tela inicial
- [x] Limitar exibição a **5 metas** e **5 transações** em `app/(tabs)/index.tsx`
- [x] Adicionar botão "Ver mais" para navegar às abas `Metas` e `Transações`

## 4. 🔧 Correção FinanceContexto (linha 104)
- [x] Corrigir `carregandoMetas` travado em `true` quando há early-return na `carregarMetas()`

## 5. ✔️ Validação final
- [x] Rodar `npx tsc --noEmit` para checar tipos


## 6. Ajustes
 - [] Ta tendo um problema de repetição no notificação, por exemplo, quando eu entro com a minha conta no app no notificação aparece uma mensagem de conclusão de metas, so que se eu sair do app e entrar novamente logando a minha conta novamente aparece a mesma mensagem so que repetida, num é tanto alguns testes, tem a mesma notificação de 1d, 1d e 3min atras, o que n deveria acontecer.
 - [] Agora na parte de perfil, no termos de uso e Politica de privacidade não tem nada e nem backup na Nuvem (eu gostaria de trocar essa parte por outra coisa, não me parece algo interessante em um app de financia ter uma backup aqui), nas perguntas Freauentes, só é uma caixa de texto, no feedback, poderia trocar esses emojis por icones da biblioteca que já está instaldada, o mesmo vale para o emoji de estrela do 'EduFinance v1.0'