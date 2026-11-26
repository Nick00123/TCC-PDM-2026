<div align="center">
  <img src="./assets/images/logo.edufinance.png" alt="Símbolo do EduFinance" width="96" />
  <h1>EduFinance</h1>
  <p><strong>Aprenda. Planeje. Conquiste.</strong></p>
  <p>Educação financeira para organizar o presente e planejar o futuro.</p>
  <p>
    <img src="https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white" alt="Expo SDK 58" />
    <img src="https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black" alt="React Native 0.88" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" />
    <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

## Sobre o projeto

O EduFinance é um aplicativo mobile de educação financeira. Ele reúne ferramentas para registrar movimentações, acompanhar metas, entender hábitos de consumo e acessar conteúdo educativo em um só lugar.

O app foi desenvolvido com **Expo**, **React Native** e **TypeScript**. A autenticação e os dados são integrados ao **Supabase**, e a navegação usa **Expo Router**.

## Funcionalidades

- **Acompanhamento financeiro:** resumo de saldo, receitas, despesas e movimentações recentes.
- **Transações:** cadastro, busca, filtros e histórico organizado por dia.
- **Metas:** criação de objetivos, depósitos e acompanhamento de progresso.
- **Relatórios:** visão mensal, gráficos por categoria e tendências; exportação do resumo em PDF.
- **Aprendizado:** dicas categorizadas, vídeos e análise financeira personalizada.
- **Notificações:** avisos financeiros e do sistema, com opções para marcar como lidos e remover.
- **Conta e suporte:** cadastro, login, recuperação de senha, edição de perfil e envio de feedback.

## Telas

| Tela | O que você encontra |
| --- | --- |
| **Apresentação** (`/intro`) | Introdução ao app e acesso ao login ou cadastro |
| **Autenticação** (`/login`) | Login, criação de conta e solicitação de redefinição de senha |
| **Redefinir senha** (`/reset`) | Atualização de senha por link de recuperação |
| **Início** (`/(tabs)`) | Resumo financeiro, notificações e atalhos |
| **Transações** (`/(tabs)/transacoes`) | Cadastro e consulta de receitas e despesas |
| **Metas** (`/(tabs)/metas`) | Objetivos financeiros e progresso |
| **Relatórios** (`/(tabs)/relatorios`) | Resumos e gráficos por período |
| **Dicas** (`/(tabs)/dicas`) | Conteúdo educativo, vídeos e análise personalizada |
| **Perfil** (`/(tabs)/perfil`) | Dados da conta, suporte, feedback e preferências |

## Tecnologias

- Expo SDK 58
- React Native 0.88
- TypeScript
- Expo Router
- Supabase Auth, Database, Storage e Edge Functions
- Victory Native para gráficos

## Como executar

### Pré-requisitos

- Node.js e npm
- Um projeto Supabase configurado
- Expo Go em um dispositivo ou um emulador Android/iOS

### 1. Clonar e instalar

```bash
git clone https://github.com/Nick00123/TCC-PDM-2026.git
cd TCC-PDM-2026
npm install
```

### 2. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-do-supabase

# Opcionais: habilitam os atalhos de contato no perfil.
EXPO_PUBLIC_SUPPORT_EMAIL=suporte@exemplo.com
EXPO_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

Os valores de URL e chave pública ficam nas configurações de API do Supabase. Variáveis com prefixo `EXPO_PUBLIC_` são incluídas no app; **não coloque chaves secretas ou `service_role` nelas**.

### 3. Preparar o Supabase

O projeto Supabase precisa ter as tabelas, políticas de acesso e recursos usados pelo app configurados. O bucket `avatars` é usado para fotos de perfil, e a Edge Function `bright-endpoint` é usada pela análise personalizada.

As migrações abaixo complementam o esquema existente para o fluxo de notificações. Execute-as, em ordem, no **SQL Editor** do mesmo projeto Supabase:

1. [`20261125215500_feedback_reply_notifications.sql`](./supabase/migrations/20261125215500_feedback_reply_notifications.sql) — cria uma notificação quando o painel salva uma resposta ao feedback.
2. [`20261125222500_soft_delete_notifications.sql`](./supabase/migrations/20261125222500_soft_delete_notifications.sql) — persiste a remoção de notificações para que avisos automáticos apagados não reapareçam.

Esses arquivos não criam o esquema completo do banco de dados.

### 4. Iniciar o Expo

```bash
npx expo start
```

Use o QR code com o Expo Go ou escolha um emulador no menu do Expo.

## Comandos úteis

| Comando | Ação |
| --- | --- |
| `npm run android` | Inicia o app em um emulador/dispositivo Android |
| `npm run ios` | Inicia o app no simulador iOS |
| `npm run web` | Inicia a versão web do Expo |
| `npm run lint` | Executa o lint do projeto |
| `npx tsc --noEmit` | Verifica os tipos TypeScript |

> O simulador iOS requer macOS com Xcode. Em Windows, use um dispositivo Android, emulador Android ou a versão web.

## Estrutura do projeto

```text
app/                  Rotas e telas do Expo Router
  (tabs)/             Telas da navegação principal
components/           Componentes reutilizáveis
utils/                Acesso a dados, sessão, animações e formatação
assets/images/        Imagens e identidade visual
supabase/migrations/  Migrações SQL complementares
```

---

<p align="center">EduFinance — aprenda, planeje e conquiste seus objetivos.</p>
