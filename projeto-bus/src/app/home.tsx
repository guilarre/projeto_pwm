import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'favoritos' | 'perfil'>('mapa');

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <View style={styles.externalContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.phoneFrame}>
        <SafeAreaView style={styles.safeArea}>
          
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>
              {abaAtiva === 'mapa' && 'Mapa & Monitoramento'}
              {abaAtiva === 'favoritos' && 'Linhas Favoritas'}
              {abaAtiva === 'perfil' && 'Perfil do Utilizador'}
            </ThemedText>
          </View>

          <View style={styles.content}>
            {abaAtiva === 'mapa' && (
              <View style={styles.tabContent}>
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map-outline" size={48} color="#27ae60" />
                  <ThemedText style={styles.mapText}>Área do Mapa de Recife</ThemedText>
                  <ThemedText style={styles.subtext}>Integração com API de geolocalização GTFS</ThemedText>
                </View>
              </View>
            )}

            {abaAtiva === 'favoritos' && (
              <View style={styles.tabContent}>
                <ThemedText style={styles.subtext}>As suas linhas favoritas aparecerão aqui.</ThemedText>
              </View>
            )}

            {abaAtiva === 'perfil' && (
              <View style={styles.profileContainer}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={40} color="#27ae60" />
                </View>
                <ThemedText style={styles.profileName}>Arthur Azevedo</ThemedText>
                <ThemedText style={styles.subtext}>arthur@unicap.br</ThemedText>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                  <ThemedText style={styles.logoutText}>Sair / Deslogar</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.bottomNav}>
            <TouchableOpacity 
              style={[styles.navItem, abaAtiva === 'mapa' && styles.navItemActive]} 
              onPress={() => setAbaAtiva('mapa')}
            >
              <Ionicons name="map" size={20} color={abaAtiva === 'mapa' ? '#27ae60' : '#888'} />
              <ThemedText style={[styles.navText, abaAtiva === 'mapa' && styles.navTextActive]}>Mapa</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, abaAtiva === 'favoritos' && styles.navItemActive]} 
              onPress={() => setAbaAtiva('favoritos')}
            >
              <Ionicons name="star" size={20} color={abaAtiva === 'favoritos' ? '#27ae60' : '#888'} />
              <ThemedText style={[styles.navText, abaAtiva === 'favoritos' && styles.navTextActive]}>Favoritos</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, abaAtiva === 'perfil' && styles.navItemActive]} 
              onPress={() => setAbaAtiva('perfil')}
            >
              <Ionicons name="person" size={20} color={abaAtiva === 'perfil' ? '#27ae60' : '#888'} />
              <ThemedText style={[styles.navText, abaAtiva === 'perfil' && styles.navTextActive]}>Perfil</ThemedText>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externalContainer: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  phoneFrame: { width: '100%', maxWidth: 420, height: '100%', maxHeight: 850, backgroundColor: '#f8f9fa', borderRadius: 24, overflow: 'hidden', elevation: 10 },
  safeArea: { flex: 1 },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  tabContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  mapPlaceholder: { width: '100%', height: '80%', backgroundColor: '#e9ecef', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8 },
  mapText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subtext: { fontSize: 13, color: '#666', textAlign: 'center' },
  profileContainer: { alignItems: 'center', gap: 12 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(39, 174, 96, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  logoutText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 14 },
  bottomNav: { flexDirection: 'row', height: 60, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eee', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2 },
  navItemActive: { borderTopWidth: 2, borderTopColor: '#27ae60' },
  navText: { fontSize: 11, color: '#888' },
  navTextActive: { color: '#27ae60', fontWeight: 'bold' }
});