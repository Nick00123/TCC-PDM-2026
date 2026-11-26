import type { ContextoAnalise, Meta, Notificacao, TermoDeUso, Transacao, Video } from '../types';
import { diagnosticarErroJwt, endpointAuth, endpointRest, headersAutenticados, headersPublicos, SUPABASE_URL } from './sessao';

type CabecalhosHttp = Record<string, string>;
const ESPERA_PADRAO_JWT_MS = 1000;
const ESPERA_MAXIMA_JWT_MS = 5000;
const MARGEM_ESPERA_JWT_MS = 250;

// Verifica se a mensagem da API indica um JWT emitido no futuro.
// Recebe o corpo de erro em texto e retorna true somente para esse erro específico.
function detectarErroJwtFuturo(corpoErro: string): boolean {
  // Esse erro aparece quando o relógio do servidor ainda não chegou no horário do token.
  try {
    const detalhesErro = JSON.parse(corpoErro) as { code?: unknown; message?: unknown };
    return detalhesErro.code === 'PGRST303'
      && typeof detalhesErro.message === 'string'
      && detalhesErro.message.toLowerCase().includes('jwt issued at future');
  } catch {
    return false;
  }
}

// Aguarda pelo tempo informado antes de continuar uma operação assíncrona.
// Recebe a duração em milissegundos e resolve a Promise quando o tempo termina.
function esperarMilissegundos(duracaoEmMs: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, duracaoEmMs));
}

// Envia uma requisição REST ao Supabase e trata o erro conhecido de horário do JWT.
// Recebe o caminho da consulta e as opções nativas do fetch; retorna a Response da API.
export async function executarRequisicaoRest(urlConsulta: string, opcoesDaRequisicao: RequestInit = {}): Promise<Response> {
  const tentarRequisicaoRest = () => fetch(endpointRest(urlConsulta), opcoesDaRequisicao);
  const primeiraResposta = await tentarRequisicaoRest();

  if (primeiraResposta.ok) return primeiraResposta;

  const corpoErro = await primeiraResposta.clone().text();
  if (!detectarErroJwtFuturo(corpoErro)) return primeiraResposta;

  const cabecalhoAuthorization = new globalThis.Headers(opcoesDaRequisicao.headers).get('Authorization') ?? '';
  const diagnosticoJwt = diagnosticarErroJwt(primeiraResposta, corpoErro, cabecalhoAuthorization);
  const diferencaHorarioServidorEmSegundos = diagnosticoJwt?.iatAdiantadoServidorSegundos;
  const esperaCalculadaMs = diferencaHorarioServidorEmSegundos !== null && diferencaHorarioServidorEmSegundos !== undefined
    ? Math.max(500, diferencaHorarioServidorEmSegundos * 1000 + MARGEM_ESPERA_JWT_MS)
    : ESPERA_PADRAO_JWT_MS;
  const tempoDeEsperaEmMs = Math.min(ESPERA_MAXIMA_JWT_MS, esperaCalculadaMs);

  console.warn(`JWT diagnóstico: nova tentativa REST em ${Math.round(tempoDeEsperaEmMs)} ms.`);
  // Se o JWT foi emitido no futuro segundo o servidor, aguarda e repete a mesma requisição.
  await esperarMilissegundos(tempoDeEsperaEmMs);
  return tentarRequisicaoRest();
}

// Valida uma resposta HTTP e lança o erro original quando a API indica falha.
// Recebe uma Response e retorna a mesma resposta quando a chamada foi bem-sucedida.
async function validarRespostaDaApi(respostaDaApi: Response): Promise<Response> {
  if (!respostaDaApi.ok) {
    throw new Error(await respostaDaApi.text());
  }

  return respostaDaApi;
}

// Confirma uma alteração que deve retornar os registros afetados pelo Supabase.
// Recebe a Response e não retorna valor; lança erro se nenhum registro for alterado.
async function validarAlteracaoComRegistro(respostaDaApi: Response): Promise<void> {
  // DELETE e PATCH precisam devolver algum registro para confirmar que funcionaram.
  await validarRespostaDaApi(respostaDaApi);
  const registrosAlterados = await respostaDaApi.json();
  if (!Array.isArray(registrosAlterados) || registrosAlterados.length === 0) {
    throw new Error('Nenhum registro foi alterado.');
  }
}

// Busca e converte as transações do usuário para o tipo usado pelo aplicativo.
// Recebe o identificador do usuário e os cabeçalhos; retorna uma lista de Transacao.
export async function buscarTransacoes(usuarioId: string, cabecalhos: CabecalhosHttp): Promise<Transacao[]> {
  // O usuario_id no filtro evita misturar dados de contas diferentes.
  const urlConsulta = `transacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=data.desc`;
  const respostaDaApi = await validarRespostaDaApi(await executarRequisicaoRest(urlConsulta, { headers: cabecalhos }));
  const transacoesRecebidas = await respostaDaApi.json();

  // Converte cada registro recebido para o formato definido no tipo Transacao.
  return transacoesRecebidas.map((registroDaTransacao: any): Transacao => ({
    id: registroDaTransacao.id,
    descricao: registroDaTransacao.descricao,
    categoria: registroDaTransacao.categoria,
    valor: Number(registroDaTransacao.valor),
    data: registroDaTransacao.data,
    tipo: registroDaTransacao.tipo,
  }));
}

// Envia uma nova transação para o Supabase, vinculada ao usuário informado.
// Recebe os dados sem id e os cabeçalhos; não retorna conteúdo para a tela.
export async function criarTransacao(usuarioId: string, novaTransacao: Omit<Transacao, 'id'>, cabecalhos: CabecalhosHttp): Promise<void> {
  await validarRespostaDaApi(await executarRequisicaoRest('transacoes', {
    method: 'POST',
    headers: cabecalhos,
    body: JSON.stringify({ usuario_id: usuarioId, ...novaTransacao }),
  }));
}

// Exclui uma transação somente se ela pertencer ao usuário informado.
// Recebe os identificadores e cabeçalhos; confirma a exclusão ou lança um erro.
export async function excluirTransacao(usuarioId: string, transacaoId: string, cabecalhos: CabecalhosHttp): Promise<void> {
  const urlConsulta = `transacoes?id=eq.${encodeURIComponent(transacaoId)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await validarAlteracaoComRegistro(await executarRequisicaoRest(urlConsulta, {
    method: 'DELETE',
    headers: { ...cabecalhos, Prefer: 'return=representation' },
  }));
}

// Busca e converte as metas do usuário para o tipo usado nas telas.
// Recebe o identificador do usuário e os cabeçalhos; retorna uma lista de Meta.
export async function buscarMetas(usuarioId: string, cabecalhos: CabecalhosHttp): Promise<Meta[]> {
  const urlConsulta = `metas?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=created_at.desc`;
  const respostaDaApi = await validarRespostaDaApi(await executarRequisicaoRest(urlConsulta, { headers: cabecalhos }));
  const metasRecebidas = await respostaDaApi.json();

  // O map percorre os registros e adapta nomes/valores ao tipo Meta do app.
  return metasRecebidas.map((registroDaMeta: any): Meta => ({
    id: registroDaMeta.id,
    titulo: registroDaMeta.titulo,
    atual: Number(registroDaMeta.valor_atual),
    total: Number(registroDaMeta.valor_objetivo),
  }));
}

// Cria uma meta com progresso inicial igual a zero.
// Recebe o usuário, título, objetivo e cabeçalhos; não retorna conteúdo.
export async function criarMeta(usuarioId: string, titulo: string, total: number, cabecalhos: CabecalhosHttp): Promise<void> {
  await validarRespostaDaApi(await executarRequisicaoRest('metas', {
    method: 'POST',
    headers: cabecalhos,
    body: JSON.stringify({ usuario_id: usuarioId, titulo, valor_objetivo: total, valor_atual: 0 }),
  }));
}

// Exclui a meta indicada, garantindo que ela pertença ao usuário informado.
// Recebe os identificadores e cabeçalhos; confirma a exclusão ou lança um erro.
export async function excluirMeta(usuarioId: string, metaId: string, cabecalhos: CabecalhosHttp): Promise<void> {
  const urlConsulta = `metas?id=eq.${encodeURIComponent(metaId)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  await validarAlteracaoComRegistro(await executarRequisicaoRest(urlConsulta, {
    method: 'DELETE',
    headers: { ...cabecalhos, Prefer: 'return=representation' },
  }));
}

// Consulta os valores atuais e o objetivo da meta para preparar uma atualização.
// Recebe o usuário, a meta e os cabeçalhos; retorna o primeiro registro ou null.
export async function consultarValoresAtuaisDaMeta(usuarioId: string, metaId: string, cabecalhos: CabecalhosHttp) {
  const filtroConsulta = `id=eq.${encodeURIComponent(metaId)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  const respostaDaApi = await validarRespostaDaApi(await executarRequisicaoRest(`metas?select=valor_atual,valor_objetivo&${filtroConsulta}`, { headers: cabecalhos }));
  const registrosRecebidos = await respostaDaApi.json();
  return registrosRecebidos[0] ?? null;
}

// Atualiza o progresso usando o valor anterior como proteção contra sobrescrita.
// Recebe usuário, meta, valores antigo/novo e cabeçalhos; confirma o registro alterado.
export async function atualizarProgressoDaMeta(usuarioId: string, metaId: string, valorAnterior: number, novoValor: number, cabecalhos: CabecalhosHttp): Promise<void> {
  // O filtro pelo valor anterior evita sobrescrever uma alteração mais recente.
  const filtroConsulta = `id=eq.${encodeURIComponent(metaId)}&usuario_id=eq.${encodeURIComponent(usuarioId)}&valor_atual=eq.${encodeURIComponent(valorAnterior)}`;
  await validarAlteracaoComRegistro(await executarRequisicaoRest(`metas?${filtroConsulta}`, {
    method: 'PATCH',
    headers: { ...cabecalhos, Prefer: 'return=representation' },
    body: JSON.stringify({ valor_atual: novoValor }),
  }));
}

// Busca até 50 notificações do usuário e converte os registros para Notificacao.
// Recebe o identificador do usuário e os cabeçalhos; retorna a lista encontrada.
export async function buscarNotificacoes(usuarioId: string, cabecalhos: CabecalhosHttp): Promise<Notificacao[]> {
  const urlConsulta = `notificacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&excluida=eq.false&order=criada_em.desc&limit=50`;
  const respostaDaApi = await validarRespostaDaApi(await executarRequisicaoRest(urlConsulta, { headers: cabecalhos }));
  const notificacoesRecebidas = await respostaDaApi.json();

  return notificacoesRecebidas.map((registroDaNotificacao: any): Notificacao => ({
    id: registroDaNotificacao.id,
    titulo: registroDaNotificacao.titulo,
    mensagem: registroDaNotificacao.mensagem,
    tipo: registroDaNotificacao.tipo,
    lida: registroDaNotificacao.lida,
    criadaEm: registroDaNotificacao.criada_em,
  }));
}

// Envia uma notificação; conflitos de evento repetido são ignorados pela API.
// Recebe o objeto com os dados da notificação e cabeçalhos; não retorna conteúdo.
export async function criarNotificacao(dadosDaNotificacao: object, cabecalhos: CabecalhosHttp): Promise<void> {
  await validarRespostaDaApi(await executarRequisicaoRest('notificacoes?on_conflict=usuario_id,chave_evento', {
    method: 'POST',
    headers: { ...cabecalhos, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(dadosDaNotificacao),
  }));
}

// Atualiza ou exclui notificações conforme o método HTTP informado.
// Recebe o caminho, método, cabeçalhos e campos; confirma o registro afetado.
export async function alterarNotificacoes(
  urlConsulta: string,
  metodoHttp: 'PATCH' | 'DELETE',
  cabecalhos: CabecalhosHttp,
  camposAtualizados: { lida?: boolean; excluida?: boolean } = { lida: true }
): Promise<void> {
  await validarAlteracaoComRegistro(await executarRequisicaoRest(urlConsulta, {
    method: metodoHttp,
    headers: { ...cabecalhos, Prefer: 'return=representation' },
    body: metodoHttp === 'PATCH' ? JSON.stringify(camposAtualizados) : undefined,
  }));
}

// Busca os valores e tipos das transações usados no resumo financeiro.
// Recebe o usuário e cabeçalhos; retorna o JSON da API sem transformar seus campos.
export async function buscarResumoFinanceiroUsuario(usuarioId: string, cabecalhos: CabecalhosHttp) {
  const urlConsulta = `transacoes?select=valor,tipo&usuario_id=eq.${encodeURIComponent(usuarioId)}`;
  const respostaDaApi = await validarRespostaDaApi(await executarRequisicaoRest(urlConsulta, { headers: cabecalhos }));
  return respostaDaApi.json();
}

// Registra o feedback enviado pelo usuário.
// Recebe usuário, mensagem, categoria e cabeçalhos; não retorna conteúdo.
export async function enviarFeedback(usuarioId: string, mensagem: string, categoria: string, cabecalhos: CabecalhosHttp): Promise<void> {
  await validarRespostaDaApi(await executarRequisicaoRest('feedback', {
    method: 'POST',
    headers: cabecalhos,
    body: JSON.stringify({ usuario_id: usuarioId, mensagem, categoria }),
  }));
}

// Envia dados para um fluxo de autenticação e normaliza a resposta em JSON.
// Recebe o caminho de autenticação e o payload; retorna { ok, corpo } para a tela.
export async function enviarAutenticacao(urlConsulta: string, dadosDaRequisicao: object) {
  const respostaDaApi = await fetch(endpointAuth(urlConsulta), {
    method: 'POST',
    headers: headersPublicos(),
    body: JSON.stringify(dadosDaRequisicao),
  });
  const textoRecebido = await respostaDaApi.text();
  let corpoDaResposta: any = {};
  if (textoRecebido) {
    try {
      corpoDaResposta = JSON.parse(textoRecebido);
    } catch {
      corpoDaResposta = { message: textoRecebido };
    }
  }
  return { ok: respostaDaApi.ok, corpo: corpoDaResposta };
}

// Cria ou atualiza o perfil associado ao usuário, mesclando conflitos de id.
// Recebe o usuário, nome e cabeçalhos; retorna a Response da requisição REST.
export async function salvarOuAtualizarPerfilUsuario(usuarioId: string, nome: string, cabecalhos: CabecalhosHttp): Promise<Response> {
  return executarRequisicaoRest('perfis?on_conflict=id', {
    method: 'POST',
    headers: { ...cabecalhos, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: usuarioId, nome }),
  });
}

export async function buscarTermosDeUso(cabecalhos: CabecalhosHttp): Promise<TermoDeUso[]> {
  const respostaDaApi = await validarRespostaDaApi(
    await executarRequisicaoRest('termos_uso?select=*&order=ordem.asc', { headers: cabecalhos })
  );
  return respostaDaApi.json();
}

export async function buscarVideos(cabecalhos: CabecalhosHttp): Promise<Video[]> {
  const respostaDaApi = await validarRespostaDaApi(
    await executarRequisicaoRest('videos?select=*&order=ordem.asc', { headers: cabecalhos })
  );
  return respostaDaApi.json();
}

// Solicita uma análise educativa à Edge Function com os dados financeiros atuais.
// Recebe o contexto tipado e retorna o texto da análise; falhas de rede/API são lançadas.
export async function solicitarAnaliseFinanceiraDaIA(contexto: ContextoAnalise): Promise<string> {
 
  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 30_000);
  let respostaDaApi: Response;
  try {
    respostaDaApi = await fetch(`${SUPABASE_URL}/functions/v1/bright-endpoint`, {
      method: 'POST',
      headers: await headersAutenticados(),
      body: JSON.stringify({ contexto }), //retirei o prompt e coloquei o contexto, ja que o prompt é gerado na edge function
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(limite);
  }

    if (!respostaDaApi.ok) {
    const detalhe = await respostaDaApi.text();
    throw new Error(`Falha ao analisar dados (${respostaDaApi.status}): ${detalhe}`);
  }

  const corpoDaResposta = (await respostaDaApi.json()) as { resposta?: unknown };
  if (typeof corpoDaResposta.resposta !== 'string' || !corpoDaResposta.resposta.trim()) {
    throw new Error('A Edge Function retornou uma análise inválida.');
  }

  return corpoDaResposta.resposta.trim();
};
