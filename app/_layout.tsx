import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="telalogin"
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Stack.Screen
        name="telainicial"
        options={{
          title: 'Tela Inicial',
        }}
      />
      <Stack.Screen
        name="telainicial2"
        options={{
          title: 'Tela Inicial 2',
        }}
      />
    </Stack>
);
}
