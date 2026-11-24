import React, { useState, useEffect } from "react";
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

interface BusRoute {
  objectId: string;
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  agency_id?: string;
}

// Bairros rápidos para filtro de origem/destino com 1 toque
const BAIRROS_RAPIDOS = [
  "Todos",
  "Rio Doce",
  "Barro",
  "Macaxeira",
  "Janga",
  "Boa Viagem",
  "Olinda",
  "Cdu",
];

export function LineSearch() {
  const router = useRouter();
  const [linhas, setLinhas] = useState<BusRoute[]>([]);
  const [busca, setBusca] = useState("");
  const [bairroSelecionado, setBairroSelecionado] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [openingRouteId, setOpeningRouteId] = useState<string | null>(null);

  // 1. Busca TODAS as linhas cadastradas no Back4App (limite máximo de 1000)
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

  // Ao clicar na linha, busca uma viagem (tripId) e abre a tela de itinerário/detalhes
  const handleSelectRoute = async (item: BusRoute) => {
    setOpeningRouteId(item.route_id);
    try {
      const whereQuery = { route_id: item.route_id };
      const res = await fetch(
        `${BACK4APP_CONFIG.baseUrl}/classes/Trips?where=${encodeURIComponent(
          JSON.stringify(whereQuery)
        )}&limit=1`,
        {
          headers: {
            "X-Parse-Application-Id": BACK4APP_CONFIG.appId,
            "X-Parse-REST-API-Key": BACK4APP_CONFIG.restKey,
          },
        }
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

  // 2. Filtro em tempo real combinando: Número, Nome e Bairros (Origem/Destino)
  const linhasFiltradas = linhas.filter((item) => {
    const termo = busca.toLowerCase().trim();
    const nomeCompleto = (item.route_long_name || "").toLowerCase();
    const numero = (item.route_short_name || "").toLowerCase();

    // Pesquisa por número ou nome
    const bateBuscaTexto =
      termo === "" || nomeCompleto.includes(termo) || numero.includes(termo);

    // Filtro por bairro selecionado nos chips
    const bateChipBairro =
      bairroSelecionado === "Todos" ||
      nomeCompleto.includes(bairroSelecionado.toLowerCase());

    return bateBuscaTexto && bateChipBairro;
  });

  // Quebra a string do nome em Origem e Destino
  const separarOrigemDestino = (nomeLinha: string) => {
    if (!nomeLinha) return { origem: "Recife", destino: "Recife" };
    const partes = nomeLinha.split("/");
    if (partes.length >= 2) {
      return {
        origem: partes[0].trim(),
        destino: partes[1].trim(),
      };
    }
    return {
      origem: nomeLinha.trim(),
      destino: "Circular / Retorno",
    };
  };

  return (
    <View style={styles.container}>
      {/* Componente Modular de Pesquisa por Número ou Nome */}
      <BusSearchBar
        value={busca}
        onChangeText={(texto) => {
          setBusca(texto);
          if (bairroSelecionado !== "Todos") setBairroSelecionado("Todos");
        }}
        onClear={() => setBusca("")}
        placeholder="Buscar por número (ex: 030) ou nome do bus..."
      />

      {/* Chips Rápidos de Filtragem por Bairro de Origem/Destino */}
      <View style={{ maxHeight: 42, marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {BAIRROS_RAPIDOS.map((bairro) => (
            <TouchableOpacity
              key={bairro}
              style={[
                styles.chip,
                bairroSelecionado === bairro && styles.chipActive,
              ]}
              onPress={() => {
                setBairroSelecionado(bairro);
                setBusca("");
              }}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  bairroSelecionado === bairro && styles.chipTextActive,
                ]}
              >
                {bairro}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Indicador da contagem de linhas */}
      <ThemedText style={styles.counterText}>
        {linhasFiltradas.length}{" "}
        {linhasFiltradas.length === 1
          ? "linha encontrada"
          : "linhas encontradas"}
      </ThemedText>

      {/* Listagem das Linhas */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#27ae60" />
          <ThemedText style={styles.loadingText}>
            Carregando linhas do Grande Recife...
          </ThemedText>
        </View>
      ) : linhasFiltradas.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="bus-outline" size={48} color="#ccc" />
          <ThemedText style={styles.emptyTitle}>
            Nenhuma linha encontrada
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tente pesquisar por outro número, nome ou bairro.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={linhasFiltradas}
          keyExtractor={(item) => item.objectId}
          contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
          renderItem={({ item }) => {
            const { origem, destino } = separarOrigemDestino(
              item.route_long_name,
            );
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleSelectRoute(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTopRow}>
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
                      <ActivityIndicator size="small" color="#27ae60" />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color="#aaa" />
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
                      color="#27ae60"
                    />
                    <ThemedText style={styles.detailLabel}>Origem: </ThemedText>
                    <ThemedText style={styles.detailValue} numberOfLines={1}>
                      {origem}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={14} color="#e74c3c" />
                    <ThemedText style={styles.detailLabel}>
                      Destino:{" "}
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
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipActive: {
    backgroundColor: "#27ae60",
    borderColor: "#27ae60",
  },
  chipText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  counterText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
    fontWeight: "500",
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
    color: "#666",
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    gap: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeNumero: {
    backgroundColor: "rgba(39, 174, 96, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeNumeroText: {
    color: "#27ae60",
    fontSize: 15,
    fontWeight: "bold",
  },
  badgeAgencia: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAgenciaText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },
  routeFullName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  routeDetails: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
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
    color: "#555",
  },
  detailValue: {
    fontSize: 12,
    color: "#333",
    flex: 1,
  },
});
