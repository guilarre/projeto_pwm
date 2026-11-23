import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BusMap } from '@/components/BusMap';
import { useFavorites } from '@/hooks/useFavorites';
import { BusTheme } from '@/constants/theme';

const { colors, radius } = BusTheme;

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
              {abaAtiva === 'perfil' && (usuarioLogado ? 'Perfil do Usuário' : 'Acessar Conta')}
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
                  <Pressable
                    key={item.routeId}
                    style={({ pressed }) => [
                      styles.card,
                      pressed && styles.cardPressed,
                    ]}
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
                      <View style={styles.routeBadge}>
                        <ThemedText style={styles.routeNumber}>{item.routeId}</ThemedText>
                      </View>
                      {item.headsign ? (
                        <View style={styles.badgeStatus}>
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
                        <Ionicons name="star" size={20} color={colors.favorite} />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                ))}
                {favorites.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={40} color={colors.textMuted} />
                    <ThemedText style={styles.subtext}>Nenhuma linha favoritada ainda.</ThemedText>
                  </View>
                )}
              </ScrollView>
            )}

            {abaAtiva === 'perfil' &&
              (usuarioLogado ? (
                <View style={styles.profileContainer}>
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person" size={40} color={colors.brand} />
                  </View>
                  <ThemedText style={styles.profileName}>Arthur Azevedo</ThemedText>
                  <ThemedText style={styles.subtext}>{email || 'arthur@unicap.br'}</ThemedText>
                  <ThemedText style={styles.subtext}>Sistemas para Internet - UNICAP</ThemedText>

                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                    <ThemedText style={styles.logoutText}>Sair / Deslogar</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.loginContainer}>
                  <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="bus" size={36} color={colors.brand} />
                    </View>
                    <ThemedText style={styles.appName}>BusRecife</ThemedText>
                    <ThemedText style={styles.appSubtitle}>Entre para sincronizar seus favoritos</ThemedText>
                  </View>

                  <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.label}>E-mail</ThemedText>
                      <TextInput
                        style={styles.input}
                        placeholder="seu.email@exemplo.com"
                        placeholderTextColor={colors.textMuted}
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
                        placeholderTextColor={colors.textMuted}
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
              <Ionicons name="map" size={20} color={abaAtiva === 'mapa' ? colors.brand : colors.textMuted} />
              <ThemedText style={[styles.navText, abaAtiva === 'mapa' && styles.navTextActive]}>Mapa</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, abaAtiva === 'favoritos' && styles.navItemActive]}
              onPress={() => setAbaAtiva('favoritos')}
            >
              <Ionicons name="star" size={20} color={abaAtiva === 'favoritos' ? colors.brand : colors.textMuted} />
              <ThemedText style={[styles.navText, abaAtiva === 'favoritos' && styles.navTextActive]}>
                Favoritos
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, abaAtiva === 'perfil' && styles.navItemActive]}
              onPress={() => setAbaAtiva('perfil')}
            >
              <Ionicons name="person" size={20} color={abaAtiva === 'perfil' ? colors.brand : colors.textMuted} />
              <ThemedText style={[styles.navText, abaAtiva === 'perfil' && styles.navTextActive]}>Perfil</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externalContainer: { flex: 1, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  phoneFrame: { width: '100%', maxWidth: 420, height: '100%', maxHeight: 850, backgroundColor: colors.background, overflow: 'hidden' },
  safeArea: { flex: 1 },
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  content: { flex: 1, padding: 16 },
  contentMap: { padding: 0 },
  tabContent: { flex: 1, width: '100%' },
  tabScrollContent: { flex: 1, width: '100%' },
  card: {
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.brandSoft,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeBadge: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  routeNumber: { fontSize: 13, fontWeight: 'bold', color: colors.brandText },
  routeName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  routeCoords: { fontSize: 12, color: colors.textMuted },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.liveSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { color: colors.live, fontSize: 12, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  subtext: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  profileContainer: { alignItems: 'center', gap: 12, marginTop: 40 },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  logoutText: { color: colors.danger, fontWeight: 'bold', fontSize: 14 },
  loginContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 8 },
  logoContainer: { alignItems: 'center', marginBottom: 28, gap: 6 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  appSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  formContainer: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginButton: {
    height: 46,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonText: { color: colors.brandText, fontSize: 15, fontWeight: 'bold' },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2 },
  navItemActive: { borderTopWidth: 2, borderTopColor: colors.brand },
  navText: { fontSize: 11, color: colors.textMuted },
  navTextActive: { color: colors.brand, fontWeight: 'bold' },
});