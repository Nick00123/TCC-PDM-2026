import { Text, View, StyleSheet } from 'react-native';

export default function Cabecalho() {
    return (
        <View>
        <View>
            <Text style={styles.subtitulo}>Bem-Vindo ao</Text>
            <Text style={styles.titulo}>EduFinance</Text>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    subtitulo: {
  fontSize: 13,
  color: '#888',
},
titulo: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#1a1a1a',
},
});
