import { Stack } from 'expo-router';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { supabase } from './supabaseClient';

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
  icone: string | React.ReactNode;
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
  const [carregandoMetas, setCarregandoMetas] = useState(true);

  const logout = () => setUsuario(null);

  const adicionarTransacao = (t: Omit<Transacao, 'id'>) =>
    setTransacoes(prev => [...prev, { ...t, id: Date.now().toString() }]);

  // 🔴 ADICIONADO: Função para remover transação por ID
  const removerTransacao = (id: string) =>
    setTransacoes(prev => prev.filter(t => t.id !== id));

  async function carregarMetas() {
  setCarregandoMetas(true);

  const { data, error } = await supabase
  .from('Metas')
  .select('*')
  .order('created_at', { ascending: false });

console.log("Dados:", data);
console.log("Erro:", error);

  if (error) {
    console.error(error);
    setCarregandoMetas(false);
    return;
  }

  const lista: Meta[] =
  data?.map((item: any) => ({
    id: item.id,
    titulo: item.titulo,
    atual: Number(item.valor_atual),
    total: Number(item.valor_objetivo),
  })) ?? [];

  setMetas(lista);
  setCarregandoMetas(false);
}

async function adicionarMeta(titulo: string, total: number) {
  const { error } = await supabase
    .from('Metas')
    .insert({
  titulo,
  valor_objetivo: total,
  valor_atual: 0,
});

 if (error) {
    console.error("Erro ao adicionar meta:", error);
    return;
}

  await carregarMetas();
}

async function excluirMeta(id: string) {
  const { error } = await supabase
    .from('Metas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    return;
  }

  await carregarMetas();
}

async function depositar(id: string, valor: number) {

  const meta = metas.find(m => m.id === id);

  if (!meta) return;

  const novoValor = meta.atual + valor;

  const { error } = await supabase
    .from('Metas')
    .update({
    valor_atual: novoValor,
})
    .eq('id', id);

  if (error) {
    console.error(error);
    return;
  }

  await carregarMetas();
}

  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoTotal = totalReceitas - totalDespesas;

  useEffect(() => {
    const carregar = async () => {
        await carregarMetas();
    };

    carregar();
}, []);

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      <FinanceContext.Provider
  value={{
    transacoes,
    metas,

    adicionarTransacao,
    removerTransacao,

    adicionarMeta,
    excluirMeta,
    depositar,
    carregarMetas,

    carregandoMetas,

    saldoTotal,
    totalReceitas,
    totalDespesas,
  }}
>
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