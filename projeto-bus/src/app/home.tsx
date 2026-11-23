import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BusMap } from '@/components/BusMap';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomeScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'favoritos' | 'perfil'>('mapa');

  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = () => {
    setUsuarioLogado(true);
  };

  const handleLogout = () => {
    setUsuarioLogado(false);
    setEmail('');
    setSenha('');
  };

  return (
    <View style={styles.externalContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.phoneFrame}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>
              {abaAtiva === 'mapa' && 'Mapa & Paradas (Recife / Olinda)'}
              {abaAtiva === 'favoritos' && 'Linhas Favoritas'}
              {abaAtiva === 'perfil' && (usuarioLogado ? 'Perfil do Utilizador' : 'Aceder à Conta')}
            </ThemedText>
          </View>

          <View style={[styles.content, abaAtiva === 'mapa' && styles.contentMap]}>
            {abaAtiva === 'mapa' && (
              <View style={styles.tabContent}>
                <BusMap />
              </View>
            )}

            {abaAtiva === 'favoritos' && (
              <ScrollView style={styles.tabScrollContent} contentContainerStyle={{ gap: 12 }}>
                {favorites.map((item) => (
                  <TouchableOpacity
                    key={item.routeId}
                    style={styles.card}
                    onPress={() => {
                      if (item.tripId) {
                        router.push({
                          pathname: `/route/${item.routeId}`,
                          params: {
                            longName: item.nome,
                            headsign: item.headsign || '',
                            tripId: item.tripId,
                          },
                        });
                      }
                    }}
                  >
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.routeNumber}>{item.routeId}</ThemedText>
                      {item.headsign ? (
                        <View style={styles.badgeProximo}>
                          <ThemedText style={styles.badgeText}>{item.headsign}</ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText style={styles.routeName}>{item.nome}</ThemedText>
                    <View style={styles.cardBottomRow}>
                      <ThemedText style={styles.routeCoords}>
                        {item.tripId ? 'Toque para ver itinerário no mapa' : 'Linha salva nos favoritos'}
                      </ThemedText>
                      <TouchableOpacity onPress={() => toggleFavorite(item)}>
                        <Ionicons name="star" size={20} color="#f1c40f" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                {favorites.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={40} color="#ccc" />
                    <ThemedText style={styles.subtext}>Nenhuma linha favoritada ainda.</ThemedText>
                  </View>
                )}
              </ScrollView>
            )}

            {abaAtiva === 'perfil' &&
              (usuarioLogado ? (
                <View style={styles.profileContainer}>
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person" size={40} color="#27ae60" />
                  </View>
                  <ThemedText style={styles.profileName}>Arthur Azevedo</ThemedText>
                  <ThemedText style={styles.subtext}>{email || 'arthur@unicap.br'}</ThemedText>
                  <ThemedText style={styles.subtext}>Sistemas para Internet - UNICAP</ThemedText>

                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                    <ThemedText style={styles.logoutText}>Sair / Deslogar</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.loginContainer}>
                  <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="bus" size={36} color="#27ae60" />
                    </View>
                    <ThemedText style={styles.appName}>BusRecife</ThemedText>
                    <ThemedText style={styles.appSubtitle}>Inicie sessão para sincronizar favoritos</ThemedText>
                  </View>

                  <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.label}>E-mail</ThemedText>
                      <TextInput
                        style={styles.input}
                        placeholder="seu.email@exemplo.com"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.label}>Senha</ThemedText>
                      <TextInput
                        style={styles.input}
                        placeholder="Sua senha"
                        placeholderTextColor="#888"
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry
                      />
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                      <ThemedText style={styles.loginButtonText}>Entrar</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
              <ThemedText style={[styles.navText, abaAtiva === 'favoritos' && styles.navTextActive]}>
                Favoritos
              </ThemedText>
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
  externalContainer: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  phoneFrame: { width: '100%', maxWidth: 420, height: '100%', maxHeight: 850, backgroundColor: '#f8f9fa', overflow: 'hidden' },
  safeArea: { flex: 1 },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  content: { flex: 1, padding: 16 },
  contentMap: { padding: 0 },
  tabContent: { flex: 1, width: '100%' },
  tabScrollContent: { flex: 1, width: '100%' },
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
  loginContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 8 },
  logoContainer: { alignItems: 'center', marginBottom: 28, gap: 6 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(39, 174, 96, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  appSubtitle: { fontSize: 13, color: '#666', textAlign: 'center' },
  formContainer: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  input: { height: 46, backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#e1e8ed' },
  loginButton: { height: 46, backgroundColor: '#27ae60', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  loginButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', height: 60, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eee', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2 },
  navItemActive: { borderTopWidth: 2, borderTopColor: '#27ae60' },
  navText: { fontSize: 11, color: '#888' },
  navTextActive: { color: '#27ae60', fontWeight: 'bold' },
});