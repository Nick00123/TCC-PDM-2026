import type { Meta, Notificacao, Transacao } from '../types';
import { diagnosticarErroJwt, endpointAuth, endpointRest, headersAutenticados, headersPublicos, SUPABASE_URL } from './sessao';

type Headers = Record<string, string>;
const ESPERA_PADRAO_JWT_MS = 1000;
const ESPERA_MAXIMA_JWT_MS = 5000;
const MARGEM_ESPERA_JWT_MS = 250;

function erroJwtEmitidoNoFuturo(corpoErro: string) {
  try {
    const erro = JSON.parse(corpoErro) as { code?: unknown; message?: unknown };
    return erro.code === 'PGRST303'
      && typeof erro.message === 'string'
      && erro.message.toLowerCase().includes('jwt issued at future');
  } catch {
    return false;
  }
}

function aguardar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function requisicaoRest(caminho: string, opcoes: RequestInit = {}) {
  const executar = () => fetch(endpointRest(caminho), opcoes);
  const primeiraResposta = await executar();

  if (primeiraResposta.ok) return primeiraResposta;

  const corpoErro = await primeiraResposta.clone().text();
  if (!erroJwtEmitidoNoFuturo(corpoErro)) return primeiraResposta;

  const authorization = new globalThis.Headers(opcoes.headers).get('Authorization') ?? '';
  const diagnostico = diagnosticarErroJwt(primeiraResposta, corpoErro, authorization);
  const diferencaServidor = diagnostico?.iatAdiantadoServidorSegundos;
  const esperaCalculada = diferencaServidor !== null && diferencaServidor !== undefined
    ? Math.max(500, diferencaServidor * 1000 + MARGEM_ESPERA_JWT_MS)
    : ESPERA_PADRAO_JWT_MS;
  const esperaMs = Math.min(ESPERA_MAXIMA_JWT_MS, esperaCalculada);

  console.warn(`JWT diagnóstico: nova tentativa REST em ${Math.round(esperaMs)} ms.`);
  await aguardar(esperaMs);
  return executar();
}

async function lerResposta(resposta: Response) {
  if (!resposta.ok) {
    throw new Error(await resposta.text());
  }

  return resposta;
}

async function lerAlteracaoComRegistro(resposta: Response) {
  await lerResposta(resposta);
  const registros = await resposta.json();
  if (!Array.isArray(registros) || registros.length === 0) {
    throw new Error('Nenhum registro foi alterado.');
  }
}

export async function buscarTransacoes(usuarioId: string, headers: Headers): Promise<Transacao[]> {
  const caminho = `transacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=data.desc`;
  const resposta = await lerResposta(await requisicaoRest(caminho, { headers }));
  const lista = await resposta.json();

  return lista.map((item: any): Transacao => ({
    id: item.id,
    descricao: item.descricao,
    categoria: item.categoria,
    valor: Number(item.valor),
    data: item.data,
    tipo: item.tipo,
  }));
}

export async function criarTransacao(usuarioId: string, nova: Omit<Transacao, 'id'>, headers: Headers) {
  await lerResposta(await requisicaoRest('transacoes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ usuario_id: usuarioId, ...nova }),
  }));
}

export async function excluirTransacao(usuarioId: string, id: string, headers: Headers) {
  const caminho = `transacoes?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await lerAlteracaoComRegistro(await requisicaoRest(caminho, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=representation' },
  }));
}

export async function buscarMetas(usuarioId: string, headers: Headers): Promise<Meta[]> {
  const caminho = `metas?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=created_at.desc`;
  const resposta = await lerResposta(await requisicaoRest(caminho, { headers }));
  const lista = await resposta.json();

  return lista.map((item: any): Meta => ({
    id: item.id,
    titulo: item.titulo,
    atual: Number(item.valor_atual),
    total: Number(item.valor_objetivo),
  }));
}

export async function criarMeta(usuarioId: string, titulo: string, total: number, headers: Headers) {
  await lerResposta(await requisicaoRest('metas', {
    method: 'POST',
    headers,
    body: JSON.stringify({ usuario_id: usuarioId, titulo, valor_objetivo: total, valor_atual: 0 }),
  }));
}

export async function excluirMeta(usuarioId: string, id: string, headers: Headers) {
  const caminho = `metas?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await lerAlteracaoComRegistro(await requisicaoRest(caminho, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=representation' },
  }));
}

export async function consultarValoresMeta(usuarioId: string, id: string, headers: Headers) {
  const filtro = `id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  const resposta = await lerResposta(await requisicaoRest(`metas?select=valor_atual,valor_objetivo&${filtro}`, { headers }));
  const registros = await resposta.json();
  return registros[0] ?? null;
}

export async function atualizarValorMeta(usuarioId: string, id: string, valorAnterior: number, novoValor: number, headers: Headers) {
  const filtro = `id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}&valor_atual=eq.${encodeURIComponent(valorAnterior)}`;
  await lerAlteracaoComRegistro(await requisicaoRest(`metas?${filtro}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ valor_atual: novoValor }),
  }));
}

export async function buscarNotificacoes(usuarioId: string, headers: Headers) {
  const caminho = `notificacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=criada_em.desc&limit=50`;
  const resposta = await lerResposta(await requisicaoRest(caminho, { headers }));
  const lista = await resposta.json();

  return lista.map((item: any): Notificacao => ({
    id: item.id,
    titulo: item.titulo,
    mensagem: item.mensagem,
    tipo: item.tipo,
    lida: item.lida,
    criadaEm: item.criada_em,
  }));
}

export async function criarNotificacao(registro: object, headers: Headers) {
  await lerResposta(await requisicaoRest('notificacoes?on_conflict=usuario_id,chave_evento', {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(registro),
  }));
}

export async function alterarNotificacoes(caminho: string, metodo: 'PATCH' | 'DELETE', headers: Headers) {
  await lerAlteracaoComRegistro(await requisicaoRest(caminho, {
    method: metodo,
    headers: { ...headers, Prefer: 'return=representation' },
    body: metodo === 'PATCH' ? JSON.stringify({ lida: true }) : undefined,
  }));
}

export async function buscarResumo(usuarioId: string, headers: Headers) {
  const caminho = `transacoes?select=valor,tipo&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  const resposta = await lerResposta(await requisicaoRest(caminho, { headers }));
  return resposta.json();
}

export async function enviarFeedback(usuarioId: string, mensagem: string, categoria: string, headers: Headers) {
  await lerResposta(await requisicaoRest('feedback', {
    method: 'POST',
    headers,
    body: JSON.stringify({ usuario_id: usuarioId, mensagem, categoria }),
  }));
}

export async function enviarAutenticacao(caminho: string, dados: object) {
  const resposta = await fetch(endpointAuth(caminho), {
    method: 'POST',
    headers: headersPublicos(),
    body: JSON.stringify(dados),
  });
  const texto = await resposta.text();
  let corpo: any = {};
  if (texto) {
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = { message: texto };
    }
  }
  return { ok: resposta.ok, corpo };
}

export async function salvarPerfil(usuarioId: string, nome: string, headers: Headers) {
  return requisicaoRest('perfis?on_conflict=id', {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: usuarioId, nome }),
  });
}

export type ContextoAnalise = {
  receitas: number;
  despesas: number;
  metas: object[];
  dicasDisponiveis: object[];
};

export async function pedirAnalise(contexto: ContextoAnalise): Promise<string> {
  const prompt = `
Você é um mentor financeiro educativo, empático e objetivo do app EduFinance.
Analise somente os dados fornecidos. Não invente valores nem prometa rendimentos.
Produza uma resposta curta, em português do Brasil, com no máximo 80 palavras.
Indique uma ação que possa ser feita no app e recomende exatamente um conteúdo
presente em "dicasDisponiveis".

Responda obrigatoriamente neste formato, sem JSON e sem introdução:
Situação Atual: <uma frase sobre receitas, despesas e saldo>
Recomendação: <uma orientação prática e educativa>
Sugestão de Conteúdo: <título exato de uma dica ou vídeo disponível>

Dados financeiros atuais:
${JSON.stringify(contexto)}
  `.trim();

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 30_000);
  let resposta: Response;
  try {
    resposta = await fetch(`${SUPABASE_URL}/functions/v1/bright-endpoint`, {
      method: 'POST',
      headers: await headersAutenticados(),
      body: JSON.stringify({ prompt, contexto }),
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(limite);
  }

  if (!resposta.ok) {
    throw new Error(`Falha ao analisar dados (${resposta.status}).`);
  }

  const corpo = (await resposta.json()) as { resposta?: unknown };
  if (typeof corpo.resposta !== 'string' || !corpo.resposta.trim()) {
    throw new Error('A Edge Function retornou uma análise inválida.');
  }

  return corpo.resposta.trim();
}
