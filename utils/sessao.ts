import AsyncStorage from '@react-native-async-storage/async-storage';

const urlSupabaseConfigurada = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chaveAnonimaConfigurada = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!urlSupabaseConfigurada || !chaveAnonimaConfigurada) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas.');
}

export const SUPABASE_URL: string = urlSupabaseConfigurada;
export const SUPABASE_ANON_KEY: string = chaveAnonimaConfigurada;

const CHAVE_SESSAO = '@edufinance:sessao-http';
// Renovo um pouco antes de vencer para evitar erro no meio de uma requisição.
const MARGEM_EXPIRACAO_MS = 60 * 1000;

export type Sessao = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      nome?: string;
    };
  };
};

type RespostaRefresh = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user?: Sessao['user'];
};

let renovacaoEmAndamento: Promise<Sessao | null> | null = null;

// Monta os cabeçalhos usados em chamadas que não exigem uma sessão autenticada.
// Não recebe argumentos; retorna a chave pública e o tipo de conteúdo JSON.
export function headersPublicos(): Record<string, string> {
  // Esses headers são suficientes para chamadas públicas do Supabase.
  return {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

// Monta o endpoint de autenticação a partir do caminho informado.
// Recebe o caminho da rota e retorna a URL completa de autenticação.
export function endpointAuth(caminhoEndpoint: string): string {
  return `${SUPABASE_URL}/auth/v1/${caminhoEndpoint}`;
}

// Monta o endpoint REST a partir do caminho informado.
// Recebe o caminho da consulta e retorna a URL completa da API REST.
export function endpointRest(caminhoEndpoint: string): string {
  return `${SUPABASE_URL}/rest/v1/${caminhoEndpoint}`;
}

// Valida a resposta de autenticação e converte seus campos para o tipo Sessao.
// Recebe a resposta do refresh; retorna uma sessão completa ou null se faltar dado.
export function criarSessao(dadosDaResposta: RespostaRefresh): Sessao | null {
  // Se faltar algum dado importante, considero que a sessão veio inválida.
  if (
    !dadosDaResposta.access_token ||
    !dadosDaResposta.refresh_token ||
    (!dadosDaResposta.expires_in && !dadosDaResposta.expires_at) ||
    !dadosDaResposta.user
  ) {
    return null;
  }

  return {
    accessToken: dadosDaResposta.access_token,
    refreshToken: dadosDaResposta.refresh_token,
    expiresAt: dadosDaResposta.expires_at
      ? dadosDaResposta.expires_at * 1000
      : Date.now() + (dadosDaResposta.expires_in ?? 3600) * 1000,
    user: dadosDaResposta.user,
  };
}

// Persiste a sessão localmente para reutilizá-la entre aberturas do aplicativo.
// Recebe uma sessão válida; não retorna conteúdo.
export async function salvarSessao(sessao: Sessao): Promise<void> {
  // A sessão fica salva para a pessoa não precisar entrar toda hora.
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

// Lê e converte a sessão armazenada no dispositivo.
// Não recebe argumentos; retorna a sessão salva ou null se estiver ausente/inválida.
export async function carregarSessao(): Promise<Sessao | null> {
  const sessaoSalva = await AsyncStorage.getItem(CHAVE_SESSAO);

  if (!sessaoSalva) return null;

  try {
    return JSON.parse(sessaoSalva) as Sessao;
  } catch {
    await removerSessao();
    return null;
  }
}

// Remove do armazenamento local os dados de autenticação salvos.
// Não recebe argumentos nem retorna conteúdo.
export async function removerSessao(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}

// Renova a sessão com o refresh token e salva o novo access token.
// Recebe a sessão atual; retorna a sessão renovada ou a versão mais recente salva.
async function renovarSessao(sessao: Sessao): Promise<Sessao | null> {
  // Uso o refresh token para conseguir um access token novo.
  const respostaDaApi = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: headersPublicos(),
      body: JSON.stringify({ refresh_token: sessao.refreshToken }),
    }
  );

  if (!respostaDaApi.ok) {
    if (respostaDaApi.status === 400 || respostaDaApi.status === 401) {
      const sessaoAtual = await carregarSessao();

      if (sessaoAtual?.refreshToken === sessao.refreshToken) {
        await removerSessao();
      }
    }

    throw new Error('Não foi possível renovar a sessão.');
  }

  const dadosDaResposta = (await respostaDaApi.json()) as RespostaRefresh;

  const sessaoRenovada = criarSessao({
    ...dadosDaResposta,
    user: dadosDaResposta.user ?? sessao.user,
  });

  if (!sessaoRenovada) {
    throw new Error('Resposta inválida ao renovar a sessão.');
  }

  const sessaoAtual = await carregarSessao();

  if (!sessaoAtual || sessaoAtual.refreshToken !== sessao.refreshToken) {
    return sessaoAtual;
  }

  await salvarSessao(sessaoRenovada);
  return sessaoRenovada;
}

// Obtém a sessão salva e a renova quando está próxima do vencimento.
// Não recebe argumentos; retorna a sessão válida ou null se não houver sessão.
export async function obterSessaoValida(): Promise<Sessao | null> {
  const sessao = await carregarSessao();

  if (!sessao) return null;

  if (sessao.expiresAt > Date.now() + MARGEM_EXPIRACAO_MS) {
    return sessao;
  }

  // Só uma renovação roda por vez, mesmo se várias telas pedirem a sessão.
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = renovarSessao(sessao).finally(() => {
      renovacaoEmAndamento = null;
    });
  }

  return renovacaoEmAndamento;
}

// Obtém os dados do usuário da sessão atual, renovando a sessão se necessário.
// Não recebe argumentos; retorna o usuário ou null quando não há sessão válida.
export async function obterUsuarioDaSessao(): Promise<Sessao['user'] | null> {
  const sessao = await obterSessaoValida();
  return sessao?.user ?? null;
}

// Cria cabeçalhos autenticados com o access token da sessão válida.
// Não recebe argumentos; retorna os cabeçalhos ou lança erro se não houver login.
export async function headersAutenticados(): Promise<Record<string, string>> {
  // Esse header identifica a conta que está fazendo a requisição.
  const sessao = await obterSessaoValida();

  if (!sessao) {
    throw new Error('Usuário não autenticado.');
  }

  return {
    ...headersPublicos(),
    Authorization: `Bearer ${sessao.accessToken}`,
  };
}

// Compara o horário de emissão do JWT com os relógios do cliente e servidor.
// Recebe a Response, o corpo do erro e Authorization; retorna diferenças em segundos ou null.
export function diagnosticarErroJwt(
  respostaDaApi: Response,
  corpoErro: string,
  cabecalhoAuthorization: string
): {
  iatAdiantadoServidorSegundos: number | null;
  iatAdiantadoClienteSegundos: number | null;
} | null {
  // Tento descobrir se o horário do token ficou adiantado em relação ao servidor.
  const mensagemErroNormalizada = corpoErro.toLowerCase();

  if (
    !mensagemErroNormalizada.includes('pgrst303') &&
    !mensagemErroNormalizada.includes('jwt issued at future')
  ) {
    return null;
  }

  let emissaoTokenEmSegundos: number | null = null;
  let expiracaoTokenEmSegundos: number | null = null;

  try {
    const token = cabecalhoAuthorization.replace(/^Bearer\s+/i, '');
    const payloadBase64Url = token.split('.')[1];

    if (payloadBase64Url) {
      const payloadBase64 = payloadBase64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(payloadBase64Url.length / 4) * 4, '=');
      const payloadBinario = globalThis.atob(payloadBase64);
      const payloadTexto = decodeURIComponent(
        Array.from(payloadBinario)
          .map((caractere) =>
            `%${caractere.charCodeAt(0).toString(16).padStart(2, '0')}`
          )
          .join('')
      );
      const conteudoToken = JSON.parse(payloadTexto);

      if (typeof conteudoToken.iat === 'number') emissaoTokenEmSegundos = conteudoToken.iat;
      if (typeof conteudoToken.exp === 'number') expiracaoTokenEmSegundos = conteudoToken.exp;
    }
  } catch {
    // O diagnóstico continua sem expor o token quando o payload é inválido.
  }

  const agoraCliente = Math.floor(Date.now() / 1000);
  const dataServidor = respostaDaApi.headers.get('Date');
  const horarioServidor = dataServidor
    ? Math.floor(Date.parse(dataServidor) / 1000)
    : null;
  const iatAdiantadoClienteSegundos = emissaoTokenEmSegundos === null ? null : emissaoTokenEmSegundos - agoraCliente;
  const iatAdiantadoServidorSegundos =
    emissaoTokenEmSegundos === null || horarioServidor === null || Number.isNaN(horarioServidor)
      ? null
      : emissaoTokenEmSegundos - horarioServidor;

  console.warn('JWT diagnóstico: token emitido no futuro', {
    iat: emissaoTokenEmSegundos === null ? 'indisponível' : new Date(emissaoTokenEmSegundos * 1000).toISOString(),
    exp: expiracaoTokenEmSegundos === null ? 'indisponível' : new Date(expiracaoTokenEmSegundos * 1000).toISOString(),
    horarioLocal: new Date(agoraCliente * 1000).toISOString(),
    dataServidor: dataServidor ?? 'indisponível',
    iatAdiantadoClienteSegundos: iatAdiantadoClienteSegundos ?? 'indisponível',
    iatAdiantadoServidorSegundos: iatAdiantadoServidorSegundos ?? 'indisponível',
  });

  return { iatAdiantadoServidorSegundos, iatAdiantadoClienteSegundos };
}

/*
ARQUIVO: sessao.ts

Responsabilidade:
Gerenciar a sessão do usuário, os cabeçalhos de acesso e os endpoints do Supabase.

Principais funções:
- headersPublicos()
- criarSessao()
- carregarSessao()
- obterSessaoValida()
- headersAutenticados()

Fluxo:
Autenticação -> armazenamento local -> renovação quando necessário -> requisição autenticada

Conceitos usados:
- async/await
- AsyncStorage
- refresh token
- Promise compartilhada para evitar renovações simultâneas
- tipos e respostas do Supabase
*/
