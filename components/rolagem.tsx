import { Text, View, StyleSheet } from 'react-native';  

export default function Rolagem() {
    return (
        <View style={styles.card}>
            <Text>Rolagem</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});