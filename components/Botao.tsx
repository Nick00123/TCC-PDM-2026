import { Pressable, StyleProp, Text, TextStyle, ViewStyle } from "react-native";

type BotaoProps = {
  title?: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// Renderiza um botão reutilizável com texto, cores e estilos configuráveis.
// Recebe BotaoProps; não retorna dados, apenas o botão interativo.
const Botao = (props: BotaoProps) => {
  const tituloBotao = props.title || "Título";
  const acaoAoPressionar = props.onPress;
  const corFundo = props.color || '#73b05f';
  const corTexto = props.textColor || '#000000';
  const estiloBotao = props.style;
  const estiloTexto = props.textStyle;

  return (
    <Pressable
      onPress={acaoAoPressionar}
      style={[
        {
          backgroundColor: corFundo,
          paddingVertical: 10,
          paddingHorizontal: 30,
          borderRadius: 18,
        },
        estiloBotao,
      ]}
    >
      <Text
        style={[
          {
            color: corTexto,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          estiloTexto,
        ]}
      >
        {tituloBotao}
      </Text>
    </Pressable>
  );
};

Botao.displayName = "Botao";

export default Botao;

/*
ARQUIVO: Botao.tsx

Responsabilidade:
Fornecer um botão reutilizável com opções de texto, cores e estilos.

Principais elementos:
- Botao()
- BotaoProps

Fluxo:
Props recebidas -> aplicação de valores padrão -> interação pelo onPress

Conceitos usados:
- props tipadas
- valores padrão
- composição de estilos
- Pressable
*/
