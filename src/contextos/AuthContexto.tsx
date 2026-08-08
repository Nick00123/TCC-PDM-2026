import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../api/supabaseCliente';
import type { Usuario } from '../tipos';

type AuthContextoType = {
  usuario: Usuario | null;
  setUsuario: React.Dispatch<React.SetStateAction<Usuario | null>>;
  logout: () => void;
  carregando: boolean;
};

const AuthContexto = createContext<AuthContextoType>({
  usuario: null,
  setUsuario: () => {},
  logout: () => {},
  carregando: true,
});

export const useAuth = () => useContext(AuthContexto);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Hidrata a sessão salva no AsyncStorage ao iniciar o app
  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      const sessao = data.session;
      if (ativo && sessao?.user) {
        const user = sessao.user;
        setUsuario({
          id: user.id,
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || '',
          email: user.email || '',
          rendaMensal: 0,
          plano: 'free',
        });
      }
      if (ativo) setCarregando(false);
    });

    // Mantém o estado sincronizado com eventos de auth (login/logout/refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sessao) => {
      if (!ativo) return;
      if (sessao?.user) {
        const user = sessao.user;
        setUsuario({
          id: user.id,
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || '',
          email: user.email || '',
          rendaMensal: 0,
          plano: 'free',
        });
      } else {
        setUsuario(null);
      }
      if (ativo) setCarregando(false);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setUsuario(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContexto.Provider value={{ usuario, setUsuario, logout, carregando }}>
      {children}
    </AuthContexto.Provider>
  );
}

