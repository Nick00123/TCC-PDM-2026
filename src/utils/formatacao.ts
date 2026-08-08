/**
 * Funções utilitárias de formatação (moeda, data, cores).
 */

/** Formata um número em moeda brasileira (R$) */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formata um valor monetário com sinal (+/-) */
export function formatarComSinal(valor: number): string {
  if (valor >= 0) return `+R$ ${formatarMoeda(valor)}`;
  return `-R$ ${formatarMoeda(Math.abs(valor))}`;
}

/** Converte uma string de data ISO (YYYY-MM-DD) para texto amigável */
export function formatarData(dataStr: string): string {
  if (!dataStr) return '';
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const partes = dataStr.split('-');
  if (partes.length < 3) return dataStr;
  const dia = partes[2];
  const mesIndex = parseInt(partes[1], 10) - 1;
  return `${dia} de ${meses[mesIndex] || ''}`;
}

/** Normaliza uma data em formato livre para ISO (YYYY-MM-DD) */
export function normalizarData(dataStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return dataStr;
  const ptBr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataStr);
  if (ptBr) return `${ptBr[3]}-${ptBr[2]}-${ptBr[1]}`;
  const dash = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dataStr);
  if (dash) return `${dash[3]}-${dash[2]}-${dash[1]}`;
  return dataStr;
}

/** Cor de fundo do ícone por categoria */
export function corDaCategoria(categoria: string, tipo: 'receita' | 'despesa'): string {
  if (tipo === 'receita') return '#DCFCE7';
  switch (categoria.toLowerCase()) {
    case 'transporte': return '#E0F2FE';
    case 'alimentação': return '#DCFCE7';
    case 'assinaturas': return '#E0E7FF';
    default: return '#F1F5F9';
  }
}
