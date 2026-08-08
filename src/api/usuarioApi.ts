import type { Usuario } from '../tipos';
import { supabase } from './supabaseCliente';

/**
 * Resultado de uma operação de autenticação.
 * `usuario` é null quando falha e `mensagem` traz o motivo amigável.
 */
export type ResultadoAuth = {
  usuario: Usuario | null;
  mensagem: string | null;
};

/**
 * Converte erros do Supabase Auth em mensagens amigáveis em pt-BR.
 */
function mensagemDeErro(erro: any): string {
  const msg = erro?.message || '';
  const code = erro?.code || '';
  const texto = `${code} ${msg}`.toLowerCase();

  if (texto.includes('invalid login credentials'))
    return 'E-mail ou senha incorretos.';
  if (texto.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).';
  if (
    texto.includes('already registered') ||
    texto.includes('already been registered') ||
    texto.includes('user_already_exists')
  )
    return 'Este e-mail já está cadastrado.';
  if (texto.includes('at least 6 characters'))
    return 'A senha deve ter pelo menos 6 caracteres.';
  if (texto.includes('rate limit'))
    return 'Muitas tentativas. Aguarde alguns segundos e tente novamente.';
  if (texto.includes('weak_password'))
    return 'A senha é muito fraca. Use uma combinação mais segura.';

  return msg || 'Não foi possível concluir a operação. Tente novamente.';
}

/** Monta o objeto de usuário a partir da resposta do Supabase Auth. */
function montarUsuario(user: any, email: string): Usuario {
  return {
    id: user.id,
    nome: user.user_metadata?.nome || email.split('@')[0],
    email,
    rendaMensal: 0,
    plano: 'free',
  };
}

/** Cria o registro de perfil (best-effort, não bloqueia o fluxo). */
async function registrarPerfil(usuarioId: string, nome: string, email: string) {
  await supabase
    .from('perfis')
    .upsert({ id: usuarioId, nome, email, renda_mensal: 0, plano: 'free' })
    .maybeSingle();
}

/**
 * API de Usuário / Autenticação
 * Gerencia login, cadastro e sessão no Supabase Auth.
 */
export const usuarioApi = {
  /** Realiza login com e-mail e senha */
  async entrar(rawEmail: string, rawSenha: string): Promise<ResultadoAuth> {
    const email = rawEmail.trim().toLowerCase();
    const senha = rawSenha;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    // A causa do problema: o erro real estava sendo ignorado e
    // exibíamos apenas "usuário nulo".
    if (error || !data.user) {
      console.error('Erro no login:', error?.message || 'usuário nulo');
      return { usuario: null, mensagem: mensagemDeErro(error) };
    }

    return { usuario: montarUsuario(data.user, email), mensagem: null };
  },

/** Cadastra um novo usuário */
  async cadastrar(nome: string, rawEmail: string, rawSenha: string): Promise<ResultadoAuth> {
    const email = rawEmail.trim().toLowerCase();
    const senha = rawSenha;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    if (error) {
      console.error('Erro no cadastro:', error?.message || error);
      return { usuario: null, mensagem: mensagemDeErro(error) };
    }

    const user = data.user;
    if (!user) {
      return {
        usuario: null,
        mensagem: 'Não foi possível criar a conta. Tente novamente.',
      };
    }

    // Se a confirmação de e-mail está habilitada, data.session virá null.
    // Nesse caso o usuário ainda não está autenticado e precisa confirmar o e-mail.
    if (!data.session) {
      return {
        usuario: null,
        mensagem:
          'Conta criada! Confirme o e-mail que enviamos para ativar o seu login.',
      };
    }

    // Sessão ativa: garante que o perfil exista no banco.
    await registrarPerfil(user.id, nome, email);

    return { usuario: montarUsuario(user, email), mensagem: null };
  },

  /** Encerra a sessão */
  async sair(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao sair:', error);
  },
};

