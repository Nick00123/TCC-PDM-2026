/**
 * Funções utilitárias de formatação (moeda, data, cores).
 */

// Formata um valor numérico para exibição no padrão brasileiro de moeda.
// Recebe um número; retorna o texto com separadores e duas casas decimais.
export function formatarMoeda(valor: number): string {
  // Aqui o número vira dinheiro no formato que a gente usa no Brasil.
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Converte uma data ISO para um rótulo legível, como "12 de março".
// Recebe a data em texto; retorna o rótulo ou uma string vazia quando não há data.
export function formatarData(dataTexto: string): string {
  // Se não veio uma data, não tem o que mostrar.
  if (!dataTexto) return '';
  const nomesMeses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const partesData = dataTexto.split('-');
  // Se o texto não estiver no formato esperado, devolvo ele mesmo.
  if (partesData.length < 3) return dataTexto;
  const dia = partesData[2];
  const indiceMes = parseInt(partesData[1], 10) - 1;
  return `${dia} de ${nomesMeses[indiceMes] || ''}`;
}

// Converte formatos de data reconhecidos para o padrão ISO usado pelo banco.
// Recebe a data em texto; retorna a versão ISO ou o texto original se não reconhecer.
export function normalizarData(dataTexto: string): string {
  // O banco usa ano-mês-dia, então converto os formatos mais comuns.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) return dataTexto;
  const dataPtBr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataTexto);
  if (dataPtBr) return `${dataPtBr[3]}-${dataPtBr[2]}-${dataPtBr[1]}`;
  const dataComHifen = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dataTexto);
  if (dataComHifen) return `${dataComHifen[3]}-${dataComHifen[2]}-${dataComHifen[1]}`;
  return dataTexto;
}

// Escolhe a cor de fundo do ícone conforme tipo e categoria da movimentação.
// Recebe categoria e tipo; retorna o código hexadecimal da cor usada pela interface.
export function corDaCategoria(categoria: string, tipo: 'receita' | 'despesa'): string {
  // Receita fica verde e as despesas ganham cores conforme a categoria.
  if (tipo === 'receita') return '#DCFCE7';
  switch (categoria.toLowerCase()) {
    case 'transporte': return '#E0F2FE';
    case 'alimentação': return '#DCFCE7';
    case 'assinaturas': return '#E0E7FF';
    default: return '#F1F5F9';
  }
}

/*
ARQUIVO: formatacao.ts

Responsabilidade:
Reunir conversões de valores, datas e cores usadas pelas telas.

Principais funções:
- formatarMoeda()
- formatarData()
- normalizarData()
- corDaCategoria()

Fluxo:
Valor ou dado recebido -> função de formatação -> texto ou cor para a interface

Conceitos usados:
- strings e números
- expressões regulares
- arrays
- union types do TypeScript
*/
