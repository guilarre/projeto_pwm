import React from 'react';
import { View, StyleSheet } from 'react-native';
// import { BusMap } from '../components/BusMap';
import TestQueriesBack4App from '../components/TestQueriesBack4App';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
    // return <BusMap />;
    return (
        <View style={styles.container}>
        <ThemedText style={styles.title}>Painel de Testes</ThemedText>
        <TestQueriesBack4App />
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
});
