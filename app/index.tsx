import { useState } from "react";
import { Text, TextInput, View } from "react-native"

export default function Index() {
  const [nome, setNome] = useState('');
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TextInput 
      placeholder="Digite algo ..."
      onChangeText={ novoTexto =>setNome(novoTexto)}
      value={nome}
      style={{
        width: "100%",
        padding: 5,
        borderWidth: 1
      }}
      />
      <Text>{nome}</Text>
    </View>
  );
}
