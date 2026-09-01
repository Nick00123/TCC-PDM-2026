import { Image } from 'react-native';
import type { Meta, Transacao } from '../types';
import { formatarMoeda } from './formatacao';

const CORES_CATEGORIAS = [
  '#1A9E75',
  '#F59E0B',
  '#3B82F6',
  '#E24B4A',
  '#8B5CF6',
  '#F97316',
  '#64748B',
];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const ALTURA_GRAFICO = 170;

type DadosRelatorio = {
  email: string;
  transacoes: Transacao[];
  metas: Meta[];
  logoDataUrl: string;
  dataGeracao?: Date;
};

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function moeda(valor: number) {
  return `R$ ${formatarMoeda(valor)}`;
}

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onloadend = () => {
      if (typeof leitor.result === 'string') resolve(leitor.result);
      else reject(new Error('Não foi possível converter a logo.'));
    };
    leitor.onerror = () => reject(new Error('Não foi possível ler a logo.'));
    leitor.readAsDataURL(blob);
  });
}

export async function obterLogoRelatorio(): Promise<string> {
  const origem = Image.resolveAssetSource(require('../assets/images/fundoTransparante.png'));
  if (!origem?.uri) throw new Error('Logo do EduFinance não encontrada.');
  if (origem.uri.startsWith('data:')) return origem.uri;

  const resposta = await fetch(origem.uri);
  if (!resposta.ok) throw new Error('Não foi possível carregar a logo do EduFinance.');
  return blobParaDataUrl(await resposta.blob());
}

function calcularCategorias(transacoes: Transacao[]) {
  const totais = new Map<string, number>();
  transacoes
    .filter((transacao) => transacao.tipo === 'despesa')
    .forEach((transacao) => {
      totais.set(transacao.categoria, (totais.get(transacao.categoria) ?? 0) + transacao.valor);
    });

  const total = Array.from(totais.values()).reduce((soma, valor) => soma + valor, 0);
  return Array.from(totais.entries())
    .map(([nome, valor], indice) => ({
      nome,
      valor,
      porcentagem: total > 0 ? (valor / total) * 100 : 0,
      cor: CORES_CATEGORIAS[indice % CORES_CATEGORIAS.length],
    }))
    .sort((a, b) => b.valor - a.valor);
}

function criarGraficoCategorias(categorias: ReturnType<typeof calcularCategorias>) {
  if (categorias.length === 0) {
    return '<div class="estado-vazio">Nenhuma despesa cadastrada para exibir por categoria.</div>';
  }

  const circunferencia = 2 * Math.PI * 55;
  let deslocamento = 0;
  const segmentos = categorias.map((categoria) => {
    const tamanho = (categoria.porcentagem / 100) * circunferencia;
    const segmento = `<circle cx="75" cy="75" r="55" fill="none" stroke="${categoria.cor}" stroke-width="34" stroke-dasharray="${tamanho} ${circunferencia - tamanho}" stroke-dashoffset="${-deslocamento}" transform="rotate(-90 75 75)" />`;
    deslocamento += tamanho;
    return segmento;
  }).join('');

  const legenda = categorias.map((categoria) => `
    <div class="item-legenda">
      <span class="cor-legenda" style="background:${categoria.cor}"></span>
      <span class="nome-legenda">${escaparHtml(categoria.nome)}</span>
      <strong>${categoria.porcentagem.toFixed(1).replace('.', ',')}%</strong>
    </div>
  `).join('');

  return `
    <div class="categorias-layout">
      <svg class="grafico-pizza" viewBox="0 0 150 150" aria-label="Gráfico de gastos por categoria">
        ${segmentos}
        <circle cx="75" cy="75" r="35" fill="#FFFFFF" />
      </svg>
      <div class="legenda-categorias">${legenda}</div>
    </div>
  `;
}

function arredondarEscala(valor: number) {
  if (valor <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(valor));
  const normalizado = valor / magnitude;
  const fator = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return fator * magnitude;
}

function calcularSemestre(transacoes: Transacao[], dataReferencia: Date) {
  const ano = dataReferencia.getFullYear();
  const inicio = dataReferencia.getMonth() < 6 ? 0 : 6;
  const meses = Array.from({ length: 6 }, (_, indice) => inicio + indice);

  const dados = meses.map((mes) => {
    const transacoesDoMes = transacoes.filter((transacao) => {
      const [anoTransacao, mesTransacao] = transacao.data.split('-').map(Number);
      return anoTransacao === ano && mesTransacao === mes + 1;
    });
    return {
      mes: MESES[mes],
      receitas: transacoesDoMes
        .filter((transacao) => transacao.tipo === 'receita')
        .reduce((soma, transacao) => soma + transacao.valor, 0),
      despesas: transacoesDoMes
        .filter((transacao) => transacao.tipo === 'despesa')
        .reduce((soma, transacao) => soma + transacao.valor, 0),
    };
  });

  const maiorValor = Math.max(0, ...dados.map((item) => Math.max(item.receitas, item.despesas)));
  return { dados, escalaMaxima: arredondarEscala(maiorValor) };
}

function criarGraficoEvolucao(transacoes: Transacao[], dataReferencia: Date) {
  const { dados, escalaMaxima } = calcularSemestre(transacoes, dataReferencia);
  const quantidadeIntervalos = 5;
  const linhas = Array.from({ length: quantidadeIntervalos + 1 }, (_, indice) => {
    const proporcao = indice / quantidadeIntervalos;
    const valor = escalaMaxima * (1 - proporcao);
    const rotulo = escalaMaxima === 0 && indice < quantidadeIntervalos ? '' : moeda(valor);
    return `<div class="linha-escala" style="top:${proporcao * 100}%"><span>${rotulo}</span></div>`;
  }).join('');

  const colunas = dados.map((item) => {
    const alturaReceita = escalaMaxima > 0 ? (item.receitas / escalaMaxima) * ALTURA_GRAFICO : 0;
    const alturaDespesa = escalaMaxima > 0 ? (item.despesas / escalaMaxima) * ALTURA_GRAFICO : 0;
    return `
      <div class="coluna-mes">
        <div class="barras">
          <div class="barra receita" style="height:${alturaReceita}px"></div>
          <div class="barra despesa" style="height:${alturaDespesa}px"></div>
        </div>
        <strong>${item.mes}</strong>
      </div>
    `;
  }).join('');

  return `
    <div class="legenda-evolucao">
      <span><i class="cor-receita"></i> Receita</span>
      <span><i class="cor-despesa"></i> Despesa</span>
    </div>
    <div class="grafico-evolucao">
      <div class="area-escala">${linhas}</div>
      <div class="meses-grafico">${colunas}</div>
    </div>
  `;
}

function criarMetas(metas: Meta[]) {
  const emAndamento = metas.filter((meta) => meta.atual < meta.total);
  if (emAndamento.length === 0) {
    return '<div class="estado-vazio">Nenhuma meta em andamento no momento.</div>';
  }

  return emAndamento.map((meta) => {
    const porcentagem = meta.total > 0
      ? Math.min(100, Math.max(0, (meta.atual / meta.total) * 100))
      : 0;
    return `
      <div class="meta-item">
        <div class="meta-topo">
          <strong>${escaparHtml(meta.titulo)}</strong>
          <strong class="meta-porcentagem">${Math.round(porcentagem)}%</strong>
        </div>
        <div class="meta-valores">${moeda(meta.atual)} de ${moeda(meta.total)}</div>
        <div class="progresso"><div style="width:${porcentagem}%"></div></div>
      </div>
    `;
  }).join('');
}

export function criarHtmlRelatorioPdf({
  email,
  transacoes,
  metas,
  logoDataUrl,
  dataGeracao = new Date(),
}: DadosRelatorio) {
  const receitas = transacoes.filter((item) => item.tipo === 'receita');
  const despesas = transacoes.filter((item) => item.tipo === 'despesa');
  const totalReceitas = receitas.reduce((soma, item) => soma + item.valor, 0);
  const totalDespesas = despesas.reduce((soma, item) => soma + item.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const categorias = calcularCategorias(transacoes);
  const dataFormatada = dataGeracao.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @page { margin: 22px; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1E293B; background: #F8FAFC; font-size: 12px; }
        .pagina { padding: 4px; }
        .cabecalho { background: #1A9E75; color: white; border-radius: 18px; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; break-inside: avoid; page-break-inside: avoid; }
        .marca { display: flex; align-items: center; }
        .logo-wrap { width: 66px; height: 66px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-right: 16px; }
        .logo { width: 52px; height: 52px; object-fit: contain; }
        .nome-app { font-size: 25px; font-weight: 800; margin: 0 0 3px; }
        .slogan { margin: 0; opacity: .88; font-size: 11px; }
        .identificacao { text-align: right; line-height: 1.55; }
        .identificacao h1 { font-size: 18px; margin: 0 0 5px; }
        .identificacao p { margin: 0; }
        .secao { margin-top: 18px; background: white; border: 1px solid #E2E8F0; border-radius: 15px; padding: 18px; break-inside: avoid; page-break-inside: avoid; }
        .secao h2 { font-size: 16px; margin: 0 0 14px; color: #0F172A; break-after: avoid; page-break-after: avoid; }
        .cards-resumo, .movimentacoes { display: flex; gap: 12px; break-inside: avoid; page-break-inside: avoid; }
        .card-resumo, .movimento { flex: 1; border-radius: 12px; padding: 15px; background: #F8FAFC; border: 1px solid #E2E8F0; break-inside: avoid; page-break-inside: avoid; }
        .card-resumo span, .movimento span { display: block; color: #64748B; margin-bottom: 7px; }
        .card-resumo strong { font-size: 18px; }
        .receitas strong { color: #1A9E75; }
        .despesas strong { color: #E24B4A; }
        .saldo strong { color: ${saldo >= 0 ? '#0F766E' : '#E24B4A'}; }
        .categorias-layout { display: flex; align-items: center; gap: 28px; break-inside: avoid; page-break-inside: avoid; }
        .grafico-pizza { width: 180px; height: 180px; flex: 0 0 180px; }
        .legenda-categorias { flex: 1; }
        .item-legenda { display: flex; align-items: center; border-bottom: 1px solid #F1F5F9; padding: 7px 0; break-inside: avoid; page-break-inside: avoid; }
        .cor-legenda { width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
        .nome-legenda { flex: 1; }
        .legenda-evolucao { display: flex; justify-content: flex-end; gap: 18px; margin-bottom: 10px; color: #64748B; break-after: avoid; page-break-after: avoid; }
        .legenda-evolucao i { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 5px; }
        .cor-receita, .barra.receita { background: #1A9E75; }
        .cor-despesa, .barra.despesa { background: #E24B4A; }
        .grafico-evolucao { position: relative; height: 205px; padding-left: 74px; break-inside: avoid; page-break-inside: avoid; }
        .area-escala { position: absolute; left: 0; right: 0; top: 0; height: ${ALTURA_GRAFICO}px; }
        .linha-escala { position: absolute; left: 0; right: 0; border-top: 1px solid #E2E8F0; }
        .linha-escala span { position: absolute; width: 66px; left: 0; top: -7px; text-align: right; color: #64748B; font-size: 9px; padding-right: 8px; background: white; }
        .meses-grafico { height: ${ALTURA_GRAFICO + 25}px; display: flex; position: relative; z-index: 1; }
        .coluna-mes { flex: 1; height: ${ALTURA_GRAFICO + 25}px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
        .barras { height: ${ALTURA_GRAFICO}px; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 5px; }
        .barra { width: 16px; min-height: 0; border-radius: 4px 4px 0 0; }
        .coluna-mes strong { margin-top: 7px; font-size: 10px; }
        .meta-item { padding: 12px 0; border-bottom: 1px solid #E2E8F0; break-inside: avoid; page-break-inside: avoid; }
        .meta-item:last-child { border-bottom: 0; }
        .meta-topo { display: flex; justify-content: space-between; }
        .meta-porcentagem { color: #1A9E75; }
        .meta-valores { color: #64748B; margin: 6px 0 8px; }
        .progresso { height: 8px; border-radius: 5px; background: #E2E8F0; overflow: hidden; }
        .progresso div { height: 100%; border-radius: 5px; background: #1A9E75; }
        .movimento { text-align: center; }
        .movimento strong { display: block; font-size: 24px; color: #0F172A; margin-bottom: 4px; }
        .movimento span { margin: 0; }
        .estado-vazio { color: #64748B; background: #F8FAFC; border-radius: 10px; padding: 15px; text-align: center; }
        .rodape { text-align: center; color: #64748B; padding: 22px 0 5px; line-height: 1.6; }
        .rodape strong { display: block; color: #1A9E75; }
      </style>
    </head>
    <body>
      <main class="pagina">
        <header class="cabecalho">
          <div class="marca">
            <div class="logo-wrap"><img class="logo" src="${logoDataUrl}" alt="Logo EduFinance" /></div>
            <div><p class="nome-app">EduFinance</p><p class="slogan">Organize hoje, planeje amanhã</p></div>
          </div>
          <div class="identificacao">
            <h1>Relatório Financeiro</h1>
            <p>${escaparHtml(email)}</p>
            <p>Gerado em ${escaparHtml(dataFormatada)}</p>
          </div>
        </header>

        <section class="secao">
          <h2>Resumo financeiro</h2>
          <div class="cards-resumo">
            <div class="card-resumo receitas"><span>Receitas</span><strong>${moeda(totalReceitas)}</strong></div>
            <div class="card-resumo despesas"><span>Despesas</span><strong>${moeda(totalDespesas)}</strong></div>
            <div class="card-resumo saldo"><span>Saldo atual</span><strong>${moeda(saldo)}</strong></div>
          </div>
        </section>

        <section class="secao"><h2>Gastos por categoria</h2>${criarGraficoCategorias(categorias)}</section>
        <section class="secao"><h2>Evolução financeira</h2>${criarGraficoEvolucao(transacoes, dataGeracao)}</section>
        <section class="secao"><h2>Metas em andamento</h2>${criarMetas(metas)}</section>

        <section class="secao">
          <h2>Resumo das movimentações</h2>
          <div class="movimentacoes">
            <div class="movimento"><strong>${receitas.length}</strong><span>Receitas cadastradas</span></div>
            <div class="movimento"><strong>${despesas.length}</strong><span>Despesas cadastradas</span></div>
            <div class="movimento"><strong>${transacoes.length}</strong><span>Movimentações totais</span></div>
          </div>
        </section>

        <footer class="rodape">Relatório gerado automaticamente pelo EduFinance<strong>Organize hoje, planeje amanhã</strong></footer>
      </main>
    </body>
  </html>`;
}
