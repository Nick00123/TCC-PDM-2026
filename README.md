# EduFinance

Aplicativo de educação financeira desenvolvido com Expo e React Native. A navegação usa Expo Router, com rotas organizadas pelos arquivos da pasta `app`.

## Telas e rotas

### Apresentação — `/intro`

Arquivo: [`app/intro.tsx`](./app/intro.tsx)

Apresenta o EduFinance e direciona a pessoa para entrar ou criar uma conta. Exibe o logo, uma breve descrição e cards informativos sobre controle financeiro, metas, relatórios, exportação em PDF e assistente inteligente. Os cards são apenas informativos.

- **Entrar na minha conta:** abre a rota de autenticação já na opção de login.
- **Criar nova conta:** abre a mesma rota na opção de cadastro.
- Antes de navegar, o app verifica se já há uma sessão válida; se houver, abre diretamente a área autenticada.

### Autenticação — `/login`

Arquivo: [`app/login.tsx`](./app/login.tsx)

Reúne login, cadastro e solicitação de redefinição de senha em uma única tela.

- **Abas “Entrar” e “Criar conta”:** alternam o formulário. O cadastro solicita nome, e-mail e senha; o login solicita e-mail e senha.
- **Campos de e-mail e senha:** recebem as credenciais. No cadastro, o campo de nome também é obrigatório.
- **Ícone de olho:** mostra ou oculta a senha.
- **Acessar Conta / Finalizar Cadastro:** valida os campos e envia a operação ao Supabase. Com sessão válida, abre a área principal; erros são apresentados em alertas.
- **Esqueci minha senha:** usa o e-mail informado para solicitar um link de redefinição. O link recebido abre a rota `/reset`.

### Redefinição de senha — `/reset`

Arquivo: [`app/reset.tsx`](./app/reset.tsx)

Permite definir uma nova senha usando o token recebido no link de recuperação enviado por e-mail.

- **Nova senha e Confirmar nova senha:** recebem e confirmam a senha. A senha deve ter pelo menos seis caracteres e os campos precisam coincidir.
- **Atualizar senha:** valida os campos e o token, atualiza a senha no Supabase e retorna ao login quando conclui. Se o link não for válido ou a operação falhar, mostra um alerta.

### Início — `/(tabs)` (arquivo `app/(tabs)/index.tsx`)

Arquivo: [`app/(tabs)/index.tsx`](./app/(tabs)/index.tsx)

Oferece um resumo das finanças, acesso às notificações e atalhos para as demais áreas. Mostra o saldo total, receitas e despesas, até cinco metas em andamento e até cinco transações recentes.

- **Sino de notificações:** abre um painel com avisos do sistema, metas e finanças. É possível tocar em um aviso não lido para marcá-lo como lido, marcar todos como lidos ou excluir um aviso após confirmação.
- **Atalhos Receita e Despesa:** levam à aba Transações; nela, a pessoa pode abrir o formulário correspondente.
- **Atalho Relatório:** abre a aba Relatórios.
- **Atalho Metas:** abre a aba Metas.
- **Ver todas as metas / Ver todas as transações:** aparece quando há mais itens do que os exibidos na prévia e abre a respectiva aba.
- **Evolução mensal:** gráfico de barras compara receitas e despesas do ano atual. Os botões Jan–Jun e Jul–Dez alternam o semestre.
- **Gastos por Categoria:** gráfico de rosca e legenda mostram a distribuição das despesas por categoria, quando existem despesas cadastradas.

### Transações — `/(tabs)/transacoes`

Arquivo: [`app/(tabs)/transacoes.tsx`](./app/(tabs)/transacoes.tsx)

Permite registrar receitas e despesas, consultar o histórico e excluir lançamentos. O cabeçalho mostra um resumo dos valores de acordo com os filtros aplicados.

- **Receita / Despesa:** abre um formulário modal para adicionar o lançamento. A pessoa informa valor e descrição e escolhe uma categoria; a data usada é a data atual. As categorias variam conforme o tipo.
- **Adicionar Receita / Adicionar Despesa:** valida os campos e salva o lançamento. O formulário só fecha após o salvamento bem-sucedido.
- **Buscar:** filtra as transações pela descrição.
- **Todos / Receitas / Despesas:** filtra a lista e atualiza o resumo e o contador.
- **Lixeira de uma transação:** pede confirmação antes de excluir o lançamento e atualiza a lista depois.
- **Lista agrupada por dia:** mostra descrição, categoria, valor e total diário.

### Relatórios — `/(tabs)/relatorios`

Arquivo: [`app/(tabs)/relatorios.tsx`](./app/(tabs)/relatorios.tsx)

Resume e visualiza a movimentação financeira do mês selecionado. No topo, apresenta cards de receitas, despesas, valor economizado e taxa de poupança.

- **Seletor de mês:** toca-se no mês/ano exibido para abrir um modal com os meses. Ao selecionar um mês, os cards e o gráfico de categorias são atualizados. Os relatórios usam o ano atual.
- **Visão Geral:** exibe a comparação de receitas e despesas em gráfico de área/linha; Jan–Jun e Jul–Dez alternam o semestre mostrado.
- **Categorias:** exibe gráfico de rosca e valores/percentuais de despesas por categoria do mês. Sem despesas, apresenta o estado vazio.
- **Tendências:** mostra a evolução mensal da economia em um gráfico de linha.

### Dicas — `/(tabs)/dicas`

Arquivo: [`app/(tabs)/dicas.tsx`](./app/(tabs)/dicas.tsx)

Reúne uma análise financeira personalizada, conteúdo educativo e vídeos. A análise considera transações, metas ativas e dicas disponíveis; sem transações, orienta a registrar a primeira receita ou despesa.

- **Atualizar análise:** solicita novamente o carregamento e a análise personalizada.
- **Busca:** filtra as dicas por título, descrição ou categoria.
- **Cards de dicas:** abrem um modal com a descrição e o conteúdo completo. **Entendi!** ou o ícone de fechar encerra o modal.
- **Ver mais / Ver menos:** expande ou reduz a lista quando não há uma busca ativa.
- **Cards de vídeo:** abrem o endereço do vídeo fora do app.

### Perfil — `/(tabs)/perfil`

Arquivo: [`app/(tabs)/perfil.tsx`](./app/(tabs)/perfil.tsx)

Mostra os dados básicos da conta e oferece edição do perfil, suporte, feedback, termos e encerramento da sessão.

- **Botão de edição do perfil:** abre um modal com a foto/avatar e o campo de nome. Tocar na foto abre a galeria; **Cancelar** descarta a edição e **Confirmar e salvar** grava as alterações. A foto é armazenada no bucket privado `avatars` do Supabase Storage.
- **Relatório em PDF:** gera um resumo financeiro e abre o compartilhamento do dispositivo.
- **Termos de Uso e Política de Privacidade:** abre um modal para consultar os textos e fechá-lo.
- **Atendimento via Gmail / WhatsApp:** abre o aplicativo correspondente com o contato configurado.
- **Categorias de feedback:** selecionam Sugestão, Bug ou Elogio.
- **Campo de feedback e Enviar Feedback:** envia a mensagem aos desenvolvedores; o campo é limpo quando o envio conclui.
- **Sair da Conta:** encerra a sessão e retorna à tela de login.

### Metas — `/(tabs)/metas`

Arquivo: [`app/(tabs)/metas.tsx`](./app/(tabs)/metas.tsx)

Organiza objetivos de economia, mostrando metas em andamento com valor acumulado, valor necessário, percentual e barra de progresso; metas concluídas aparecem em uma seção própria.

- **Nova Meta:** abre um formulário modal com nome e valor necessário. **Criar Meta** valida os dados e salva; **Cancelar** fecha o formulário.
- **+ Depositar:** abre um modal para informar quanto adicionar à meta. **Confirmar** salva o depósito, desde que seja positivo e não exceda o valor que falta; **Cancelar** fecha o modal.
- **Lixeira da meta em andamento:** solicita confirmação antes da exclusão.
- **Metas concluídas:** aparecem identificadas como concluídas, sem o botão de depósito.

## Navegação e componentes compartilhados

O layout raiz em [`app/_layout.tsx`](./app/_layout.tsx) registra as rotas de apresentação, autenticação, redefinição de senha e área autenticada. A barra inferior é configurada em [`app/(tabs)/_layout.tsx`](./app/(tabs)/_layout.tsx) e contém Início, Transações, Relatórios, Dicas, Perfil e Metas.

Modais de notificações, formulários, seleção de mês, edição de perfil, termos, dicas e metas fazem parte das telas descritas acima; não são rotas independentes.

## Executar o projeto

Instale as dependências e inicie o servidor Expo:

```bash
npm install
npx expo start
```
