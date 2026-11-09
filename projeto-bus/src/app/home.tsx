import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

const PARADAS_RECIFE = [
  { id: '1', routeId: '1981', nome: 'T.I. Rio Doce / T.I. Joana Bezerra (Ida)', tempo: 'Próximo (0 min)', coords: 'Boa Vista, Recife - PE', top: '30%', left: '40%' },
  { id: '2', routeId: '030', nome: 'Recife / Boa Viagem', tempo: '3 min', coords: 'Boa Viagem, Recife - PE', top: '60%', left: '70%' },
  { id: '3', routeId: '202', nome: 'Barro / Macaxeira (Várzea)', tempo: '5 min', coords: 'Caxangá, Recife - PE', top: '45%', left: '25%' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'favoritos' | 'perfil'>('mapa');
  const [favoritos, setFavoritos] = useState<string[]>(['1', '2']);
  const [pontoSelecionado, setPontoSelecionado] = useState<typeof PARADAS_RECIFE[0] | null>(null);

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

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
              {abaAtiva === 'mapa' && 'Mapa & Monitoramento (Recife)'}
              {abaAtiva === 'favoritos' && 'Linhas Favoritas'}
              {abaAtiva === 'perfil' && 'Perfil do Utilizador'}
            </ThemedText>
          </View>

          <View style={styles.content}>
            {abaAtiva === 'mapa' && (
              <View style={styles.tabContent}>
                <View style={styles.mapContainer}>
                  <View style={styles.mapHeaderInfo}>
                    <Ionicons name="location" size={16} color="#27ae60" />
                    <ThemedText style={styles.mapHeaderText}>Recife, PE - GTFS Ativo</ThemedText>
                  </View>
                  
                  <View style={styles.mapVisualMock}>
                    <Ionicons name="map" size={64} color="#bdc3c7" />
                    <ThemedText style={styles.mapSubText}>Toque num marcador para ver detalhes</ThemedText>
                    
                    {/* Marcadores Interativos no Mapa */}
                    {PARADAS_RECIFE.map(ponto => (
                      <TouchableOpacity 
                        key={ponto.id}
                        style={[styles.marker, { top: ponto.top, left: ponto.left }, pontoSelecionado?.id === ponto.id && styles.markerActive]}
                        onPress={() => setPontoSelecionado(ponto)}
                      >
                        <Ionicons name="bus" size={14} color="#fff" />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Card flutuante ao clicar num marcador do mapa */}
                  {pontoSelecionado && (
                    <View style={styles.mapPopupCard}>
                      <View style={styles.popupTopRow}>
                        <ThemedText style={styles.routeNumber}>Linha {pontoSelecionado.routeId}</ThemedText>
                        <TouchableOpacity onPress={() => setPontoSelecionado(null)}>
                          <Ionicons name="close" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <ThemedText numberOfLines={1} style={styles.routeName}>{pontoSelecionado.nome}</ThemedText>
                      <View style={styles.popupBottomRow}>
                        <ThemedText style={styles.timeText}>Previsão: {pontoSelecionado.tempo}</ThemedText>
                        <TouchableOpacity onPress={() => toggleFavorito(pontoSelecionado.id)}>
                          <Ionicons 
                            name={favoritos.includes(pontoSelecionado.id) ? "star" : "star-outline"} 
                            size={20} 
                            color="#f1c40f" 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {abaAtiva === 'favoritos' && (
              <ScrollView style={styles.tabScrollContent} contentContainerStyle={{ gap: 12 }}>
                {PARADAS_RECIFE.filter(p => favoritos.includes(p.id)).map(item => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.routeNumber}>{item.routeId}</ThemedText>
                      <View style={styles.badgeProximo}>
                        <Ionicons name="time-outline" size={12} color="#27ae60" />
                        <ThemedText style={styles.badgeText}>{item.tempo}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.routeName}>{item.nome}</ThemedText>
                    <View style={styles.cardBottomRow}>
                      <ThemedText style={styles.routeCoords}>{item.coords}</ThemedText>
                      <TouchableOpacity onPress={() => toggleFavorito(item.id)}>
                        <Ionicons name="star" size={20} color="#f1c40f" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {favoritos.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={40} color="#ccc" />
                    <ThemedText style={styles.subtext}>Nenhuma linha favoritada ainda.</ThemedText>
                  </View>
                )}
              </ScrollView>
            )}

            {abaAtiva === 'perfil' && (
              <View style={styles.profileContainer}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={40} color="#27ae60" />
                </View>
                <ThemedText style={styles.profileName}>Arthur Azevedo</ThemedText>
                <ThemedText style={styles.subtext}>arthur@unicap.br</ThemedText>
                <ThemedText style={styles.subtext}>Sistemas para Internet - UNICAP</ThemedText>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                  <ThemedText style={styles.logoutText}>Sair / Deslogar</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Barra de Navegação Inferior */}
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
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  content: { flex: 1, padding: 16 },
  tabContent: { flex: 1, width: '100%' },
  tabScrollContent: { flex: 1, width: '100%' },
  mapContainer: { flex: 1, backgroundColor: '#e9ecef', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#dee2e6', position: 'relative' },
  mapHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  mapHeaderText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  mapVisualMock: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', gap: 4 },
  mapSubText: { fontSize: 12, color: '#666' },
  marker: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  markerActive: { backgroundColor: '#e67e22', transform: [{ scale: 1.2 }] },
  mapPopupCard: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6, borderWidth: 1, borderColor: '#eee' },
  popupTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popupBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  card: { padding: 14, backgroundColor: '#ffffff', borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeNumber: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  routeName: { fontSize: 13, fontWeight: '600', color: '#333' },
  routeCoords: { fontSize: 11, color: '#666' },
  badgeProximo: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(39, 174, 96, 0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: '#27ae60', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  subtext: { fontSize: 13, color: '#666', textAlign: 'center' },
  profileContainer: { alignItems: 'center', gap: 12, marginTop: 40 },
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