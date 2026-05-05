import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
// Importando seu componente que criamos antes
import Botao from '../components/Botao';

export default function App() {
  const [salario, setSalario] = useState('');
  const router = useRouter();

  const confirmar = () => {
    Alert.alert('Bem-vindo!', `O seu salário é de R$ ${salario}, seu cadastro foi concluído.`);
    router.push('/telainicial2');
  };
  

  return (
    <View style={styles.container}>

    {/* IMAGEM FORA DO CARD (ABAIXO) */}
    <Image 
      source={ require ('../assets/images/logo.png') } 
      style={styles.logo} 
    />
      <Text style={styles.titulo}>Ultima Etapa!</Text>
      {/* O Card com Sombra */}
      <View style={styles.card}>
        
        
        <Text style={styles.label}>Quanto você ganha?</Text>
        <TextInput
          style={styles.input}
          placeholder="Diga o seu salário..."
          keyboardType="decimal-pad"
          value={salario}
          onChangeText={setSalario}
        />

        {/* Usando o seu componente de Botão personalizado */}
        <Botao 
          title="Concluir --->" 
          onPress={confirmar} 
          color="#7DC1A8" 
        />

        {/* Usando um botão simples de outra cor para testar */}
        {/*<Botao 
          titulo="Limpar" 
          onPress={() => setNome('')} 
          cor="#e74c3c" 
        />*/}

        { /*{salario ? (
          <Text style={styles.preview}>Digitando: {salario}</Text>
        ) : null}*/ }
      </View>
       <Text style={styles.footerText}>Seus dados são privados e seguros</Text>
    </View>
     
  );
}

// Sugestão de mudanças no StyleSheet para um look profissional
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7DC1A8', // Um verde mais profundo e "financeiro"
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 38,
    fontWeight: '800', // Bem pesado
    color: '#F7FFF7', // Branco levemente off-white
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5, // Ajuste fino de tipografia
  },
  label: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 10,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 16,
    color: '#F7FFF7',
    opacity: 0.8,
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 24, // Bordas mais arredondadas são tendência
    // Sombra mais suave e espalhada (Soft Shadow)
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  input: {
    height: 55,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    marginBottom: 20,
    color: '#212529',
  },
  footerText: {
    marginTop: 25,
    fontSize: 12,
   color: '#F7FFF7',      // Mesma cor off-white do título
  opacity: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logo: {
  width: 280,           // Aumente ou diminua aqui
  height: 400,          // Aumente ou diminua aqui
  resizeMode: 'contain', // Mantém a proporção da imagem
  marginBottom: -60,     // Espaço entre a logo e o texto abaixo
}
});