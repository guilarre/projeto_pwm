import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { BusTheme } from "@/constants/theme";

const { colors, radius } = BusTheme;

export default function AboutScreen() {
  const router = useRouter();

  const abrirLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Erro ao abrir link:", err),
    );
  };

  return (
    <View style={styles.externalContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.phoneFrame}>
        <SafeAreaView style={styles.safeArea}>
          {/* Cabeçalho com botão Voltar */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.brand} />
              <ThemedText style={styles.backText}>Voltar</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Sobre e Ajuda</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo e Nome do App */}
            <View style={styles.appHeader}>
              <View style={styles.logoCircle}>
                <Ionicons name="bus" size={40} color={colors.brand} />
              </View>
              <ThemedText style={styles.appName}>
                BusRecife
              </ThemedText>
              <ThemedText style={styles.appVersion}>
                Versão 1.0.0 • UNICAP 2026.2
              </ThemedText>
            </View>

            {/* Card 1: Fonte dos Dados (Requisito do PDF) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="server-outline" size={20} color={colors.brand} />
                <ThemedText style={styles.cardTitle}>
                  Fonte dos Dados
                </ThemedText>
              </View>
              <ThemedText style={styles.cardText}>
                Este aplicativo utiliza dados abertos no formato GTFS fornecidos
                pelo{" "}
                <ThemedText style={styles.bold}>
                  Grande Recife Consórcio de Transporte
                </ThemedText>
                , reunindo rotas, paradas e estimativas de horários da Região
                Metropolitana do Recife.
              </ThemedText>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => abrirLink("https://www.granderecife.pe.gov.br")}
                activeOpacity={0.8}
              >
                <Ionicons name="globe-outline" size={16} color={colors.brandText} />
                <ThemedText style={styles.linkButtonText}>
                  Acessar Site do Grande Recife
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Card 2: Como Reportar Problemas na Linha (Requisito do PDF) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.brand}
                />
                <ThemedText style={styles.cardTitle}>
                  Reportar Problemas na Linha
                </ThemedText>
              </View>
              <ThemedText style={styles.cardText}>
                Presenciou atrasos, mudança indevida de trajeto ou problemas no
                veículo? Use os canais oficiais do consórcio:
              </ThemedText>

              {/* Central 0800 */}
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => abrirLink("tel:08000810158")}
                activeOpacity={0.7}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="call" size={16} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.contactLabel}>
                    Central de Atendimento / Ouvidoria
                  </ThemedText>
                  <ThemedText style={styles.contactValue}>
                    0800 081 0158 (Ligação Gratuita)
                  </ThemedText>
                </View>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => abrirLink("https://wa.me/5581994883999")}
                activeOpacity={0.7}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="logo-whatsapp" size={16} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.contactLabel}>
                    WhatsApp Grande Recife
                  </ThemedText>
                  <ThemedText style={styles.contactValue}>
                    (81) 99488-3999
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            {/* Card 3: Informações Acadêmicas da Disciplina */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="school-outline" size={20} color={colors.brand} />
                <ThemedText style={styles.cardTitle}>
                  Projeto Acadêmico
                </ThemedText>
              </View>
              <ThemedText style={styles.cardText}>
                Disciplina:{" "}
                <ThemedText style={styles.bold}>
                  Programação Web e Mobile
                </ThemedText>
              </ThemedText>
              <ThemedText style={styles.cardText}>
                Professor:{" "}
                <ThemedText style={styles.bold}>Prof. Flávio Dias</ThemedText>
              </ThemedText>
              <ThemedText style={styles.cardText}>
                Instituição:{" "}
                <ThemedText style={styles.bold}>
                  Universidade Católica de Pernambuco (UNICAP)
                </ThemedText>
              </ThemedText>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externalContainer: {
    flex: 1,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  phoneFrame: {
    width: "100%",
    maxWidth: 420,
    height: "100%",
    maxHeight: 850,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: colors.brand, fontSize: 14, fontWeight: "600" },
  content: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 30 },
  appHeader: { alignItems: "center", paddingVertical: 8, gap: 4 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  appName: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary },
  appVersion: { fontSize: 12, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary },
  cardText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  bold: { fontWeight: "bold", color: colors.textPrimary },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    paddingVertical: 11,
    borderRadius: radius.md,
    marginTop: 4,
  },
  linkButtonText: { color: colors.brandText, fontSize: 13, fontWeight: "bold" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: { fontSize: 11, color: colors.textMuted },
  contactValue: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
});
