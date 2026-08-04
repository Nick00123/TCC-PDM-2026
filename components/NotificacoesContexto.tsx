/*import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: 'sucesso' | 'alerta' | 'info';
};

type NotificacoesContextType = {
  notificacoes: Notificacao[];
  adicionarNotificacao: (titulo: string, mensagem: string, tipo: 'sucesso' | 'alerta' | 'info') => void;
  marcarComoLida: (id: string) => void;
};

const NotificacoesContext = createContext<NotificacoesContextType | undefined>(undefined);

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  // Função para formatar a hora atual no padrão "Hoje às HH:mm"
  const formatarHoraAtual = () => {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    return `Hoje às ${horas}:${minutos}`;
  };

  // Função para adicionar uma nova notificação dinâmica
  const adicionarNotificacao = (
    titulo: string, 
    mensagem: string, 
    tipo: 'sucesso' | 'alerta' | 'info'
  ) => {
    const novaNotificacao: Notificacao = {
      id: Date.now().toString(),
      titulo,
      mensagem,
      data: formatarHoraAtual(),
      lida: false,
      tipo,
    };

    setNotificacoes((prev) => [novaNotificacao, ...prev]);
  };

  const marcarComoLida = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  return (
    <NotificacoesContext.Provider value={{ notificacoes, adicionarNotificacao, marcarComoLida }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  }
  return context;
}*/