import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { BACK4APP_CONFIG } from "@/config/back4app";
import { BusSearchBar } from "@/components/BusSearchBar";
import { BusTheme } from "@/constants/theme";
import { SharedStyles } from "@/styles/shared";

const { colors, radius } = BusTheme;

interface BusRoute {
  objectId: string;
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  agency_id?: string;
}

type FiltroDirecao = "todos" | "origem" | "destino";

// Remove acentos e normaliza para facilitar busca e comparação de bairros
function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Limpa observações entre parênteses como "(Várzea)" ou "(Circular)" para extrair o nome do bairro/terminal
function limparBairro(parte: string) {
  return parte.replace(/\([^)]*\)/g, "").trim();
}

// Quebra o nome da linha em Origem e Destino final
function separarOrigemDestino(nomeLinha: string) {
  if (!nomeLinha) return { origem: "Recife", destino: "Recife" };
  const partes = nomeLinha.split("/");
  if (partes.length >= 2) {
    return {
      origem: partes[0].trim(),
      destino: partes[partes.length - 1].trim(),
    };
  }
  const ehCircular = normalizarTexto(nomeLinha).includes("circular");
  return {
    origem: nomeLinha.trim(),
    destino: ehCircular ? "Circular (mesmo terminal)" : nomeLinha.trim(),
  };
}

export function LineSearch() {
  const router = useRouter();
  const [linhas, setLinhas] = useState<BusRoute[]>([]);
  const [busca, setBusca] = useState("");
  const [bairroSelecionado, setBairroSelecionado] = useState("Todos");
  const [filtroDirecao, setFiltroDirecao] = useState<FiltroDirecao>("todos");
  const [loading, setLoading] = useState(true);
  const [openingRouteId, setOpeningRouteId] = useState<string | null>(null);

  // 1. Busca TODAS as linhas cadastradas no Back4App
  useEffect(() => {
    async function carregarLinhas() {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACK4APP_CONFIG.baseUrl}/classes/Routes?limit=1000&order=route_short_name`,
          {
            headers: {
              "X-Parse-Application-Id": BACK4APP_CONFIG.appId,
              "X-Parse-REST-API-Key": BACK4APP_CONFIG.restKey,
            },
          },
        );
        const data = await response.json();
        if (data.results) {
          setLinhas(data.results);
        }
      } catch (error) {
        console.error("Erro ao buscar linhas no Back4App:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarLinhas();
  }, []);

  // Gera chips dinamicamente a partir das origens/destinos reais carregados do banco
  const bairrosDisponiveis = useMemo(() => {
    const mapaBairros = new Map<string, string>();

    linhas.forEach((linha) => {
      const { origem, destino } = separarOrigemDestino(linha.route_long_name);
      const candidatos =
        filtroDirecao === "origem"
          ? [origem]
          : filtroDirecao === "destino"
            ? [destino]
            : [origem, destino];

      candidatos.forEach((cand) => {
        const limpo = limparBairro(cand);
        if (!limpo || limpo.startsWith("Circular")) return;
        const chave = normalizarTexto(limpo);
        if (!mapaBairros.has(chave)) {
          mapaBairros.set(chave, limpo);
        }
      });
    });

    return ["Todos", ...Array.from(mapaBairros.values()).sort((a, b) => a.localeCompare(b))];
  }, [linhas, filtroDirecao]);

  // Se trocar de modo (ex: Origem -> Destino) e o bairro atual não existir nesse modo, volta para "Todos"
  useEffect(() => {
    if (bairroSelecionado !== "Todos" && !bairrosDisponiveis.includes(bairroSelecionado)) {
      setBairroSelecionado("Todos");
    }
  }, [bairrosDisponiveis, bairroSelecionado]);

  // Ao clicar na linha, busca uma viagem (tripId) e abre a tela de itinerário/detalhes
  const handleSelectRoute = async (item: BusRoute) => {
    setOpeningRouteId(item.route_id);
    try {
      const whereQuery = { route_id: item.route_id };
      const res = await fetch(
        `${BACK4APP_CONFIG.baseUrl}/classes/Trips?where=${encodeURIComponent(
          JSON.stringify(whereQuery),
        )}&limit=1`,
        {
          headers: {
            "X-Parse-Application-Id": BACK4APP_CONFIG.appId,
            "X-Parse-REST-API-Key": BACK4APP_CONFIG.restKey,
          },
        },
      );
      const data = await res.json();
      const trip = data.results?.[0];

      router.push({
        pathname: `/route/${item.route_id}` as any,
        params: {
          id: item.route_id,
          longName: item.route_long_name,
          headsign: trip?.trip_headsign || item.route_long_name,
          tripId: trip?.trip_id || "",
        },
      });
    } catch (err) {
      console.error("Erro ao abrir rota:", err);
      router.push({
        pathname: `/route/${item.route_id}` as any,
        params: {
          id: item.route_id,
          longName: item.route_long_name,
        },
      });
    } finally {
      setOpeningRouteId(null);
    }
  };

  // 2. Filtro combinado: Busca por número/nome + Bairro (Todos / Origem / Destino)
  const linhasFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);
    const bairroNorm = normalizarTexto(bairroSelecionado);

    return linhas.filter((item) => {
      const nomeCompleto = normalizarTexto(item.route_long_name || "");
      const numero = normalizarTexto(item.route_short_name || "");
      const { origem, destino } = separarOrigemDestino(item.route_long_name);
      const origemNorm = normalizarTexto(origem);
      const destinoNorm = normalizarTexto(destino);

      // Se o usuário escolheu "Origem" ou "Destino", a busca textual também pode combinar com ambos
      const bateBuscaTexto =
        termo === "" || nomeCompleto.includes(termo) || numero.includes(termo);

      let bateChipBairro = true;
      if (bairroSelecionado !== "Todos") {
        if (filtroDirecao === "origem") {
          bateChipBairro = origemNorm.includes(bairroNorm);
        } else if (filtroDirecao === "destino") {
          bateChipBairro = destinoNorm.includes(bairroNorm);
        } else {
          bateChipBairro =
            origemNorm.includes(bairroNorm) ||
            destinoNorm.includes(bairroNorm) ||
            nomeCompleto.includes(bairroNorm);
        }
      }

      return bateBuscaTexto && bateChipBairro;
    });
  }, [linhas, busca, bairroSelecionado, filtroDirecao]);

  const limparFiltros = () => {
    setBusca("");
    setBairroSelecionado("Todos");
    setFiltroDirecao("todos");
  };

  return (
    <View style={styles.container}>
      {/* Campo de Busca por Número ou Nome */}
      <BusSearchBar
        value={busca}
        onChangeText={setBusca}
        onClear={() => setBusca("")}
        placeholder="Buscar por número (ex: 030) ou nome da linha..."
      />

      {/* Seletor de escopo do filtro de bairro (Todos / Origem / Destino) */}
      <View style={styles.filterScopeRow}>
        <ThemedText style={styles.filterScopeLabel}>Filtrar por:</ThemedText>
        <View style={styles.segmentedControl}>
          {(
            [
              { key: "todos", label: "Origem/Destino" },
              { key: "origem", label: "Origem" },
              { key: "destino", label: "Destino" },
            ] as const
          ).map((opcao) => {
            const ativo = filtroDirecao === opcao.key;
            return (
              <TouchableOpacity
                key={opcao.key}
                style={[styles.segmentBtn, ativo && styles.segmentBtnActive]}
                onPress={() => setFiltroDirecao(opcao.key)}
              >
                <ThemedText
                  style={[styles.segmentText, ativo && styles.segmentTextActive]}
                >
                  {opcao.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chips dinâmicos de Bairros/Terminais */}
      <View style={{ maxHeight: 40, marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {bairrosDisponiveis.map((bairro) => {
            const ativo = bairroSelecionado === bairro;
            return (
              <TouchableOpacity
                key={bairro}
                style={[styles.chip, ativo && styles.chipActive]}
                onPress={() => setBairroSelecionado(bairro)}
              >
                <ThemedText
                  style={[styles.chipText, ativo && styles.chipTextActive]}
                >
                  {bairro}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Indicador da contagem de linhas + atalho para limpar */}
      <View style={styles.counterRow}>
        <ThemedText style={styles.counterText}>
          {linhasFiltradas.length}{" "}
          {linhasFiltradas.length === 1
            ? "linha encontrada"
            : "linhas encontradas"}
        </ThemedText>
        {(busca !== "" || bairroSelecionado !== "Todos" || filtroDirecao !== "todos") && (
          <TouchableOpacity onPress={limparFiltros}>
            <ThemedText style={styles.clearFiltersText}>Limpar filtros</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Listagem das Linhas */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.brand} />
          <ThemedText style={styles.loadingText}>
            Carregando linhas do Grande Recife...
          </ThemedText>
        </View>
      ) : linhasFiltradas.length === 0 ? (
        <View style={SharedStyles.emptyContainer}>
          <Ionicons name="bus-outline" size={48} color={colors.textMuted} />
          <ThemedText style={styles.emptyTitle}>
            Nenhuma linha encontrada
          </ThemedText>
          <ThemedText style={SharedStyles.emptyText}>
            Tente pesquisar por outro número, nome ou bairro.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={linhasFiltradas}
          keyExtractor={(item) => item.objectId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
          renderItem={({ item }) => {
            const { origem, destino } = separarOrigemDestino(item.route_long_name);
            return (
              <TouchableOpacity
                style={SharedStyles.card}
                onPress={() => handleSelectRoute(item)}
                activeOpacity={0.7}
              >
                <View style={SharedStyles.cardTopRow}>
                  <View style={styles.badgeNumero}>
                    <ThemedText style={styles.badgeNumeroText}>
                      {item.route_short_name}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {item.agency_id && (
                      <View style={styles.badgeAgencia}>
                        <ThemedText style={styles.badgeAgenciaText}>
                          {item.agency_id}
                        </ThemedText>
                      </View>
                    )}
                    {openingRouteId === item.route_id ? (
                      <ActivityIndicator size="small" color={colors.brand} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    )}
                  </View>
                </View>

                <ThemedText style={styles.routeFullName}>
                  {item.route_long_name}
                </ThemedText>

                <View style={styles.routeDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="radio-button-on"
                      size={14}
                      color={colors.brand}
                    />
                    <ThemedText style={styles.detailLabel}>Origem: </ThemedText>
                    <ThemedText style={styles.detailValue} numberOfLines={1}>
                      {origem}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={14} color={colors.danger} />
                    <ThemedText style={styles.detailLabel}>
                      Destino final:{" "}
                    </ThemedText>
                    <ThemedText style={styles.detailValue} numberOfLines={1}>
                      {destino}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterScopeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  filterScopeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.brand,
    fontWeight: "bold",
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  chipTextActive: {
    color: colors.brandText,
    fontWeight: "bold",
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  counterText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  clearFiltersText: {
    fontSize: 12,
    color: colors.brand,
    fontWeight: "600",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  badgeNumero: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeNumeroText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "bold",
  },
  badgeAgencia: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeAgenciaText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  routeFullName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  routeDetails: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
  },
});


