import AsyncStorage from '@react-native-async-storage/async-storage';

const urlConfigurada = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chaveConfigurada = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!urlConfigurada || !chaveConfigurada) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas.');
}

export const SUPABASE_URL: string = urlConfigurada;
export const SUPABASE_ANON_KEY: string = chaveConfigurada;

const CHAVE_SESSAO = '@edufinance:sessao-http';
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
  expires_in: number;
  expires_at?: number;
  user?: Sessao['user'];
};

let refreshEmAndamento: Promise<Sessao | null> | null = null;

export function headersPublicos(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

export function endpointAuth(caminho: string): string {
  return `${SUPABASE_URL}/auth/v1/${caminho}`;
}

export function endpointRest(caminho: string): string {
  return `${SUPABASE_URL}/rest/v1/${caminho}`;
}

export function criarSessao(dados: RespostaRefresh): Sessao | null {
  if (
    !dados.access_token ||
    !dados.refresh_token ||
    !dados.expires_in ||
    !dados.user
  ) {
    return null;
  }

  return {
    accessToken: dados.access_token,
    refreshToken: dados.refresh_token,
    expiresAt: dados.expires_at
      ? dados.expires_at * 1000
      : Date.now() + dados.expires_in * 1000,
    user: dados.user,
  };
}

export async function salvarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

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

export async function removerSessao(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}

async function renovarSessao(sessao: Sessao): Promise<Sessao | null> {
  const resposta = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: headersPublicos(),
      body: JSON.stringify({ refresh_token: sessao.refreshToken }),
    }
  );

  if (!resposta.ok) {
    if (resposta.status === 400 || resposta.status === 401) {
      const sessaoAtual = await carregarSessao();

      if (sessaoAtual?.refreshToken === sessao.refreshToken) {
        await removerSessao();
      }
    }

    throw new Error('Não foi possível renovar a sessão.');
  }

  const dados = (await resposta.json()) as RespostaRefresh;

  const sessaoRenovada = criarSessao({
    ...dados,
    user: dados.user ?? sessao.user,
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

export async function obterSessaoValida(): Promise<Sessao | null> {
  const sessao = await carregarSessao();

  if (!sessao) return null;

  if (sessao.expiresAt > Date.now() + MARGEM_EXPIRACAO_MS) {
    return sessao;
  }

  if (!refreshEmAndamento) {
    refreshEmAndamento = renovarSessao(sessao).finally(() => {
      refreshEmAndamento = null;
    });
  }

  return refreshEmAndamento;
}

export async function obterUsuarioDaSessao(): Promise<Sessao['user'] | null> {
  const sessao = await obterSessaoValida();
  return sessao?.user ?? null;
}

export async function headersAutenticados(): Promise<Record<string, string>> {
  const sessao = await obterSessaoValida();

  if (!sessao) {
    throw new Error('Usuário não autenticado.');
  }

  return {
    ...headersPublicos(),
    Authorization: `Bearer ${sessao.accessToken}`,
  };
}

export function diagnosticarErroJwt(
  resposta: Response,
  corpoErro: string,
  authorization: string
): void {
  const erroNormalizado = corpoErro.toLowerCase();

  if (
    !erroNormalizado.includes('pgrst303') &&
    !erroNormalizado.includes('jwt issued at future')
  ) {
    return;
  }

  let sub: string | number = 'indisponível';
  let iat: number | null = null;
  let exp: number | null = null;

  try {
    const token = authorization.replace(/^Bearer\s+/i, '');
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
      const payload = JSON.parse(payloadTexto);

      if (typeof payload.sub === 'string' || typeof payload.sub === 'number') {
        sub = payload.sub;
      }
      if (typeof payload.iat === 'number') iat = payload.iat;
      if (typeof payload.exp === 'number') exp = payload.exp;
    }
  } catch {
    // O diagnóstico continua sem expor o token quando o payload é inválido.
  }

  const agoraCliente = Math.floor(Date.now() / 1000);
  const dataServidor = resposta.headers.get('Date');
  const horarioServidor = dataServidor
    ? Math.floor(Date.parse(dataServidor) / 1000)
    : null;

  console.warn('DIAGNÓSTICO JWT', {
    sub,
    iat: iat ?? 'indisponível',
    exp: exp ?? 'indisponível',
    agoraCliente,
    dataServidor: dataServidor ?? 'indisponível',
    iatAdiantadoClienteSegundos:
      iat === null ? 'indisponível' : iat - agoraCliente,
    iatAdiantadoServidorSegundos:
      iat === null || horarioServidor === null || Number.isNaN(horarioServidor)
        ? 'indisponível'
        : iat - horarioServidor,
    validadeJwtSegundos:
      iat === null || exp === null ? 'indisponível' : exp - iat,
  });
}
