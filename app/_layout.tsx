import { Stack } from 'expo-router';
import React, { createContext, useContext, useState } from 'react';

export type Usuario = {
  nome: string;
  email: string;
  rendaMensal: number;
  plano: 'free' | 'premium';
};

export type Transacao = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa';
  icone: string;
};

export type Meta = {
  id: string;
  titulo: string;
  atual: number;
  total: number;
};

export const AuthContext = createContext<any>({});
export const FinanceContext = createContext<any>({});

export const useAuth = () => useContext(AuthContext);
export const useFinance = () => useContext(FinanceContext);

export default function RootLayout() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);

  const logout = () => setUsuario(null);

  const adicionarTransacao = (t: Omit<Transacao, 'id'>) =>
    setTransacoes(prev => [...prev, { ...t, id: Date.now().toString() }]);

  const adicionarMeta = (m: Omit<Meta, 'id'>) =>
    setMetas(prev => [...prev, { ...m, id: Date.now().toString() }]);

  const depositar = (id: string, valor: number) =>
    setMetas(prev => prev.map(m => m.id === id ? { ...m, atual: m.atual + valor } : m));

  const excluirMeta = (id: string) =>
    setMetas(prev => prev.filter(m => m.id !== id));

  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoTotal = totalReceitas - totalDespesas;

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      <FinanceContext.Provider value={{
        transacoes, metas,
        adicionarTransacao, adicionarMeta,
        depositar, excluirMeta,
        saldoTotal, totalReceitas, totalDespesas,
      }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="telalogin" />
          <Stack.Screen name="telainicial" />
          <Stack.Screen name="telainicial2" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </FinanceContext.Provider>
    </AuthContext.Provider>
  );
}