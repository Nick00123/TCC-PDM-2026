import { Stack } from 'expo-router';


export const unstable_settings = {
  // A primeira tela que aparece quando o app abre.
  initialRouteName: 'intro',
};

// Define a pilha de navegação inicial e as transições entre telas principais.
// Não recebe props nem retorna dados; registra as rotas do aplicativo.
export default function RootLayout() {
  // Aqui ficam as telas principais e as animações de troca.
  return (
    <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          >
            <Stack.Screen name="intro" />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="reset" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

/*
ARQUIVO: app/_layout.tsx

Responsabilidade:
Configurar a navegação raiz e a tela inicial do aplicativo.

Principais elementos:
- RootLayout()
- unstable_settings
- rotas intro, login, reset e tabs

Fluxo:
Inicialização -> rota intro -> navegação para autenticação ou abas

Conceitos usados:
- Expo Router Stack
- opções de navegação
- exportação de configuração de rota
*/
