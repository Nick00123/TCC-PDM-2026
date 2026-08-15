# EduFinance - Instruções para o Codex

## Contexto

Este é um projeto acadêmico de conclusão de curso desenvolvido com Expo, React Native e TypeScript.

O objetivo atual é simplificar o projeto para que sua arquitetura seja compatível com o nível ensinado na disciplina.

Projeto de referência utilizado pelo professor:
https://github.com/IFPBHugo/fetch_pdm

## Regra principal

Priorize simplicidade e código didático.

Não transforme o projeto em uma arquitetura profissional complexa.

Não adicione abstrações sem necessidade.

## Não utilizar sem necessidade

Evite:

- Context API
- createContext
- useContext
- Providers
- useReducer
- useMemo
- useCallback
- custom hooks
- Redux
- Zustand
- React Query
- services
- repositories
- controllers
- Clean Architecture
- Dependency Injection

Não substitua uma abstração por outra.

Exemplo proibido:

src/api/metasApi.ts -> services/metasService.ts

Isso não é simplificação.

## React

Pode utilizar conceitos básicos quando necessários, principalmente:

- useState
- useEffect
- funções
- async/await
- fetch
- map

Sempre prefira a solução mais simples.

## Supabase

O projeto utiliza Supabase.

Quando adequado, prefira comunicação simples utilizando fetch e a API REST do Supabase, semelhante ao padrão utilizado no projeto de referência do professor.

Evite criar uma camada própria de API apenas para esconder as chamadas ao Supabase.

## Expo Router

A pasta app/ contém as rotas e telas.

O _layout.tsx deve permanecer simples e principalmente relacionado à navegação/configuração global necessária.

Não coloque lógica financeira, notificações ou CRUD dentro do _layout.tsx.

## Componentes

Componentes reutilizáveis de interface são permitidos.

Não transforme cada pequeno elemento em um componente.

## Refatoração

Antes de remover qualquer arquivo:

1. Descubra quem importa o arquivo.
2. Substitua as dependências.
3. Verifique se nenhum import continua utilizando o arquivo.
4. Somente então remova.

Não remova funcionalidades apenas para simplificar o código.

## Funcionalidades que devem ser preservadas

- introdução
- login
- cadastro
- dashboard
- transações
- receitas e despesas
- metas
- notificações
- perfil
- dicas
- relatórios
- navegação

## Verificação

Depois de modificar código:

- verifique erros TypeScript;
- verifique imports;
- verifique rotas;
- execute testes/comandos disponíveis quando apropriado.

Nunca afirme que algo foi testado se não foi realmente testado.

Nunca afirme que um arquivo foi removido se ele ainda existir.

## Objetivo educacional

Este projeto será posteriormente reconstruído manualmente pelo aluno em outro repositório.

Portanto, o código deve ser simples o suficiente para que cada arquivo e cada linha possam ser estudados e explicados pelo aluno.