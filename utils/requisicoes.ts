import type { Meta, Notificacao, Transacao } from '../types';
import { endpointAuth, endpointRest, headersPublicos } from './sessao';

type Headers = Record<string, string>;

async function lerResposta(resposta: Response) {
  if (!resposta.ok) {
    throw new Error(await resposta.text());
  }

  return resposta;
}

export async function buscarTransacoes(usuarioId: string, headers: Headers) {
  const caminho = `transacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=data.desc`;
  const resposta = await lerResposta(await fetch(endpointRest(caminho), { headers }));
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
  await lerResposta(await fetch(endpointRest('transacoes'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ usuario_id: usuarioId, ...nova }),
  }));
}

export async function excluirTransacao(usuarioId: string, id: string, headers: Headers) {
  const caminho = `transacoes?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await lerResposta(await fetch(endpointRest(caminho), { method: 'DELETE', headers }));
}

export async function buscarMetas(usuarioId: string, headers: Headers) {
  const caminho = `metas?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=created_at.desc`;
  const resposta = await lerResposta(await fetch(endpointRest(caminho), { headers }));
  const lista = await resposta.json();

  return lista.map((item: any): Meta => ({
    id: item.id,
    titulo: item.titulo,
    atual: Number(item.valor_atual),
    total: Number(item.valor_objetivo),
  }));
}

export async function criarMeta(usuarioId: string, titulo: string, total: number, headers: Headers) {
  await lerResposta(await fetch(endpointRest('metas'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ usuario_id: usuarioId, titulo, valor_objetivo: total, valor_atual: 0 }),
  }));
}

export async function excluirMeta(usuarioId: string, id: string, headers: Headers) {
  const caminho = `metas?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await lerResposta(await fetch(endpointRest(caminho), { method: 'DELETE', headers }));
}

export async function consultarValoresMeta(usuarioId: string, id: string, headers: Headers) {
  const filtro = `id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  const resposta = await lerResposta(await fetch(endpointRest(`metas?select=valor_atual,valor_objetivo&${filtro}`), { headers }));
  const registros = await resposta.json();
  return registros[0] ?? null;
}

export async function atualizarValorMeta(usuarioId: string, id: string, valorAtual: number, headers: Headers) {
  const filtro = `id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await lerResposta(await fetch(endpointRest(`metas?${filtro}`), {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ valor_atual: valorAtual }),
  }));
}

export async function buscarNotificacoes(usuarioId: string, headers: Headers) {
  const caminho = `notificacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=criada_em.desc&limit=50`;
  const resposta = await lerResposta(await fetch(endpointRest(caminho), { headers }));
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
  await lerResposta(await fetch(endpointRest('notificacoes?on_conflict=usuario_id,chave_evento'), {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(registro),
  }));
}

export async function alterarNotificacoes(caminho: string, metodo: 'PATCH' | 'DELETE', headers: Headers) {
  await lerResposta(await fetch(endpointRest(caminho), {
    method: metodo,
    headers,
    body: metodo === 'PATCH' ? JSON.stringify({ lida: true }) : undefined,
  }));
}

export async function buscarResumo(usuarioId: string, headers: Headers) {
  const caminho = `transacoes?select=valor,tipo&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  const resposta = await lerResposta(await fetch(endpointRest(caminho), { headers }));
  return resposta.json();
}

export async function enviarFeedback(usuarioId: string, mensagem: string, categoria: string, headers: Headers) {
  await lerResposta(await fetch(endpointRest('feedback'), {
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
  const corpo = await resposta.json();
  return { ok: resposta.ok, corpo };
}

export async function salvarPerfil(usuarioId: string, nome: string, headers: Headers) {
  return fetch(endpointRest('perfis?on_conflict=id'), {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: usuarioId, nome }),
  });
}
