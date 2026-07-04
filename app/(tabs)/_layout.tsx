import { Tabs } from 'expo-router';
import { Home, ArrowLeftRight, BarChart2, Lightbulb, User, Target } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A9E75',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 100,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transacoes"
        options={{
          title: 'Transações',
          tabBarIcon: ({ color }) => <ArrowLeftRight size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dicas"
        options={{
          title: 'Dicas',
          tabBarIcon: ({ color }) => <Lightbulb size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
      <Tabs.Screen
         name="metas"
         options={{
          title: 'Metas',
          tabBarIcon: ({ color }) => <Target size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}