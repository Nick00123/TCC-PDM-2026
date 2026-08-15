import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  carregarSessao,
  endpointAuth,
  headersPublicos,
  obterSessaoValida,
  removerSessao,
} from '../api/sessao';
import type { Sessao } from '../api/sessao';
import type { Usuario } from '../tipos';

type AuthContextoType = {
  usuario: Usuario | null;
  entrarComSessao: (sessao: Sessao) => void;
  logout: () => Promise<void>;
};

const AuthContexto = createContext<AuthContextoType>({
  usuario: null,
  entrarComSessao: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContexto);

function montarUsuario(user: Sessao['user']): Usuario {
  return {
    id: user.id,
    nome: user.user_metadata?.nome || user.email?.split('@')[0] || '',
    email: user.email || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Hidrata a sessão HTTP salva no AsyncStorage ao iniciar o app
  useEffect(() => {
    let ativo = true;

    async function recuperarSessao() {
      try {
        const sessao = await obterSessaoValida();

        if (ativo) {
          setUsuario(sessao ? montarUsuario(sessao.user) : null);
        }
      } catch {
        if (ativo) {
          setUsuario(null);
        }
      }
    }

    recuperarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  const entrarComSessao = (sessao: Sessao) => {
    setUsuario(montarUsuario(sessao.user));
  };

  const logout = async () => {
    const sessao = await carregarSessao();

    try {
      if (sessao?.accessToken) {
        await fetch(endpointAuth('logout'), {
          method: 'POST',
          headers: {
            ...headersPublicos(),
            Authorization: `Bearer ${sessao.accessToken}`,
          },
        });
      }
    } catch {
      console.error('Não foi possível encerrar a sessão remota.');
    } finally {
      setUsuario(null);
      await removerSessao();
    }
  };

  return (
    <AuthContexto.Provider value={{ usuario, entrarComSessao, logout }}>
      {children}
    </AuthContexto.Provider>
  );
}

