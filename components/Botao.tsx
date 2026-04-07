import { Pressable, StyleProp, Text, TextStyle, ViewStyle } from "react-native";

type BotaoProps = {
  title?: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const Botao = (props: BotaoProps) => {

  let title = props.title || "Título";
  let onPress = props.onPress;
  let color = props.color || '#73b05f';
  let textColor = props.textColor || '#000000';
  let style = props.style;
  let textStyle = props.textStyle;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          backgroundColor: color,
          paddingVertical: 10,
          paddingHorizontal: 30,
          borderRadius: 18,
        },
        style
      ]}
    >
      <Text
        style={[
          {
            color: textColor,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          textStyle
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

Botao.displayName = "Botao";

export default Botao;