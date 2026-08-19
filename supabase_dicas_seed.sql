-- 18 dicas originais inspiradas em temas populares de educação financeira.
-- O filtro por título torna o seed repetível sem alterar a estrutura da tabela.
with novas_dicas (titulo, descricao, categoria, conteudo) as (
values
  (
    'Ativo ou passivo: faça o teste do bolso',
    'Classifique cada bem pelo efeito que ele produz no seu fluxo de caixa mensal.',
    'Educação',
    E'Liste seus bens e compromissos financeiros.\nMarque como ativo o que gera renda ou reduz custos de forma mensurável.\nMarque como passivo o que exige pagamentos recorrentes.\nAntes de comprar, pergunte: isso fortalece ou pressiona meu caixa?'
  ),
  (
    'Leia seu fluxo de caixa todo mês',
    'Receber bem não basta: acompanhe por onde o dinheiro entra, sai e quanto permanece.',
    'Planejamento',
    E'Some todas as receitas do período.\nAgrupe as despesas por categoria.\nCalcule o saldo e compare com o mês anterior.\nEscolha uma única categoria para ajustar no próximo ciclo.'
  ),
  (
    'Construa ativos aos poucos',
    'Use uma parte possível da sobra mensal para formar patrimônio que trabalhe a seu favor.',
    'Investimento',
    E'Primeiro organize dívidas caras e sua reserva.\nDefina um aporte compatível com a sua renda.\nEstude risco, liquidez e custos antes de investir.\nAumente o aporte quando sua renda crescer, sem buscar atalhos.'
  ),
  (
    'Renda extra com teste pequeno',
    'Valide uma ideia de renda extra com baixo custo antes de investir muito dinheiro nela.',
    'Empreendedorismo',
    E'Escolha um problema real que você sabe resolver.\nConverse com possíveis clientes.\nFaça uma versão simples da oferta e registre custos e receitas.\nSó amplie depois de comprovar que existe demanda.'
  ),
  (
    'Conhecimento também é patrimônio',
    'Separe tempo para aprender habilidades que possam melhorar decisões e ampliar sua renda.',
    'Educação',
    E'Escolha uma habilidade útil para seu momento.\nDefina uma fonte confiável e um horário semanal de estudo.\nPratique em um projeto pequeno.\nMeça o resultado antes de comprar outro curso.'
  ),
  (
    'Proteja o caixa do seu projeto',
    'Não misture dinheiro pessoal com valores de uma atividade autônoma ou pequeno negócio.',
    'Empreendedorismo',
    E'Registre separadamente entradas e saídas do projeto.\nDefina uma retirada pessoal realista.\nReserve dinheiro para custos, impostos e imprevistos.\nAvalie o lucro somente depois de pagar todas as despesas.'
  ),
  (
    'Orçamento familiar sem culpados',
    'Transforme a conversa sobre dinheiro em decisões conjuntas, objetivas e periódicas.',
    'Planejamento',
    E'Marque uma conversa curta em um momento tranquilo.\nCompartilhem receitas, contas e objetivos sem julgamentos.\nDefinam limites e responsabilidades claros.\nRevisem o combinado uma vez por mês.'
  ),
  (
    'Cortes inteligentes, não sofrimento',
    'Priorize despesas que pouco contribuem para seu bem-estar antes de eliminar tudo de uma vez.',
    'Comportamento',
    E'Liste gastos recorrentes e dê uma nota de utilidade a cada um.\nCancele ou renegocie primeiro os de baixa utilidade.\nPreserve pequenas escolhas que sustentam sua rotina.\nDirecione a economia para uma meta específica.'
  ),
  (
    'Planeje a vida antes da planilha',
    'Metas financeiras funcionam melhor quando estão ligadas ao tipo de vida que você deseja construir.',
    'Metas',
    E'Descreva um objetivo importante e por que ele importa.\nDefina valor, prazo e prioridade.\nDivida o total em contribuições mensais possíveis.\nCadastre a meta no app e acompanhe o progresso.'
  ),
  (
    'Casal com autonomia e objetivos comuns',
    'Combine uma contribuição para despesas compartilhadas sem eliminar a autonomia individual.',
    'Planejamento',
    E'Definam quais contas são realmente comuns.\nEscolham contribuições proporcionais ou outro critério justo para ambos.\nMantenham um valor individual previsto no orçamento.\nRegistrem também uma meta construída em conjunto.'
  ),
  (
    'Invista com uma carta para o futuro',
    'Registre por escrito o motivo, o prazo e os riscos aceitos antes de tomar uma decisão de investimento.',
    'Investimento',
    E'Escreva o objetivo do investimento.\nAnote quando o dinheiro será necessário.\nDefina riscos que você aceita e situações que exigem revisão.\nConsulte essa carta antes de agir por medo ou euforia.'
  ),
  (
    'Aumente o padrão de poupança primeiro',
    'Quando a renda subir, eleve o valor destinado às metas antes de ampliar todos os gastos.',
    'Planejamento',
    E'Calcule quanto a renda aumentou.\nEscolha uma parcela desse aumento para suas metas.\nAutomatize a transferência perto da data do recebimento.\nUse o restante com liberdade dentro do orçamento.'
  ),
  (
    'Orçamento simples para começar hoje',
    'Um controle básico e constante vale mais do que uma planilha perfeita abandonada em uma semana.',
    'Orçamento',
    E'Anote quanto entrou no mês.\nRegistre primeiro moradia, alimentação, transporte e dívidas.\nInclua gastos pequenos e variáveis.\nCompare o total com a renda e ajuste uma categoria por vez.'
  ),
  (
    'Reserva de emergência em passos pequenos',
    'Comece com uma primeira meta acessível e aumente a proteção gradualmente.',
    'Segurança',
    E'Defina uma primeira meta que caiba na sua realidade.\nGuarde valores pequenos com frequência.\nMantenha a reserva separada e com acesso simples.\nDepois de atingir a primeira etapa, avance rumo a alguns meses de despesas essenciais.'
  ),
  (
    'Estudante também pode planejar',
    'Bolsas, estágios e trabalhos temporários podem ser organizados mesmo quando a renda varia.',
    'Planejamento',
    E'Use como base o menor valor que costuma receber.\nPriorize transporte, alimentação e materiais.\nNos meses melhores, antecipe gastos acadêmicos e reforce a reserva.\nEvite assumir parcelas que dependam de uma renda incerta.'
  ),
  (
    'Cartão de crédito não é renda',
    'Considere cada compra no cartão como parte do dinheiro do mês, e não como um recurso adicional.',
    'Crédito',
    E'Defina um limite pessoal menor que o oferecido pelo banco.\nRegistre a compra no dia em que ela acontece.\nConfira as parcelas que já comprometem os próximos meses.\nSe não puder pagar a fatura integral, interrompa novas compras e reorganize o orçamento.'
  ),
  (
    'Dinheiro para lazer cabe no plano',
    'Prever uma quantia para diversão ajuda a manter o orçamento realista e sustentável.',
    'Comportamento',
    E'Escolha um valor de lazer depois das despesas essenciais.\nInclua saídas, jogos, assinaturas e delivery na mesma categoria.\nAcompanhe o saldo durante o mês.\nQuando o limite terminar, busque opções gratuitas até o próximo ciclo.'
  ),
  (
    'Primeiro salário, primeiras escolhas',
    'Organize o primeiro salário com prioridades claras antes que novos gastos virem hábito.',
    'Educação',
    E'Entenda o valor líquido que realmente entra.\nSepare despesas essenciais e possíveis dívidas.\nCrie uma pequena reserva automática.\nDefina uma quantia consciente para lazer e outra para uma meta pessoal.'
  )
)
insert into public.dicas (titulo, descricao, categoria, conteudo)
select titulo, descricao, categoria, conteudo
from novas_dicas nova
where not exists (
  select 1 from public.dicas atual where atual.titulo = nova.titulo
);
