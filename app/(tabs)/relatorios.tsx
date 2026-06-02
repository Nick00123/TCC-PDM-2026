import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default function Relatorios() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Relatórios</Text>
    </View>
  );
}