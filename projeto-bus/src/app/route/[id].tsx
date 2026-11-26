import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACK4APP_CONFIG } from '@/config/back4app';
import { useFavorites } from '@/hooks/useFavorites';
import { BusTheme } from '@/constants/theme';
import { SharedStyles } from '@/styles/shared';

const { colors, radius } = BusTheme;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Alturas do painel inferior (expandido vs recolhido)
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.65;
const SHEET_MIN_HEIGHT = 160;
const MAX_TRANSLATE_Y = SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT;

type DayType = 'DUT' | 'SAB' | 'DOM';

interface StopLocation {
  latitude: number;
  longitude: number;
}

interface ItineraryStop {
  stop_id: string;
  stop_name: string;
  address: string;
  location: StopLocation | null;
}

interface ShapePoint {
  latitude: number;
  longitude: number;
}

interface TripRecord {
  trip_id: string;
  service_id?: string;
  direction_id?: string;
  trip_headsign?: string;
}

interface ScheduleSummary {
  primeira: string;
  ultima: string;
  intervaloMedio: string;
  totalViagens: number;
}

// Identifica o tipo de dia atual em Recife (UTC-3)
function getRecifeDayType(): DayType {
  const now = new Date();
  const recifeTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const dayOfWeek = recifeTime.getUTCDay();
  if (dayOfWeek === 0) return 'DOM';
  if (dayOfWeek === 6) return 'SAB';
  return 'DUT';
}

// Formata minutos totais (ex: 1455 -> "00:15")
function formatMinutes(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Extrai partida em minutos a partir de trip_id no formato "030-PRI-VOLTA-0400-0515-DOM-1666"
function parseTripMetadata(tripId: string) {
  const parts = tripId.split('-');
  if (parts.length < 6) return null;

  const direction = parts[2]; // IDA | VOLTA
  const departureStr = parts[3]; // HHMM
  const dayType = parts[5] as DayType; // DUT | SAB | DOM

  if (!/^\d{4}$/.test(departureStr)) return null;
  const hh = Number(departureStr.slice(0, 2));
  const mm = Number(departureStr.slice(2, 4));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  return {
    direction,
    dayType,
    departureMinutes: hh * 60 + mm,
  };
}

export default function BusDetailScreen() {
  const { id, longName, headsign, tripId } = useLocalSearchParams<{
    id: string;
    longName?: string;
    headsign?: string;
    tripId?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(String(id));

  const mapRef = useRef<MapView | null>(null);
  const flatListRef = useRef<FlatList<ItineraryStop> | null>(null);
  const markerRefs = useRef<Record<string, React.ComponentRef<typeof Marker> | null>>({});

  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [shapes, setShapes] = useState<ShapePoint[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado dos horários da linha (Primeira viagem, Última viagem e Intervalo médio)
  const [routeTrips, setRouteTrips] = useState<TripRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayType>(getRecifeDayType);

  const stopsRef = useRef<ItineraryStop[]>([]);
  const shapesRef = useRef<ShapePoint[]>([]);

  // Controle da animação do Bottom Sheet (0 = expandido, MAX_TRANSLATE_Y = recolhido)
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const fitRouteToMap = (
    isSheetOpen: boolean,
    currentShapes: ShapePoint[] = shapesRef.current,
    currentStops: ItineraryStop[] = stopsRef.current,
  ) => {
    if (!mapRef.current) return;

    const coordsToFit =
      currentShapes.length > 0
        ? currentShapes
        : currentStops
            .filter((s) => s.location !== null)
            .map((s) => ({
              latitude: Number(s.location!.latitude),
              longitude: Number(s.location!.longitude),
            }));

    if (coordsToFit.length > 0) {
      const bottomPadding = isSheetOpen ? SHEET_MAX_HEIGHT + 30 : SHEET_MIN_HEIGHT + 30;
      mapRef.current.fitToCoordinates(coordsToFit, {
        edgePadding: {
          top: 90,
          right: 50,
          bottom: bottomPadding,
          left: 50,
        },
        animated: true,
      });
    }
  };

  const animateSheetTo = (toValue: number) => {
    lastOffset.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();

    fitRouteToMap(toValue === 0);
  };

  const toggleSheet = () => {
    const nextTarget = lastOffset.current === 0 ? MAX_TRANSLATE_Y : 0;
    animateSheetTo(nextTarget);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = lastOffset.current + gestureState.dy;
        const clampedY = Math.max(0, Math.min(MAX_TRANSLATE_Y, nextY));
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = lastOffset.current + gestureState.dy;

        if (gestureState.vy > 0.5 || (gestureState.vy >= -0.5 && currentY > MAX_TRANSLATE_Y / 2)) {
          animateSheetTo(MAX_TRANSLATE_Y);
        } else {
          animateSheetTo(0);
        }
      },
    }),
  ).current;

  // Busca itinerário (paradas + traçado) da viagem atual
  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    async function fetchItinerary() {
      setLoading(true);
      try {
        const response = await fetch(`${BACK4APP_CONFIG.baseUrl}/functions/getItineraryForBus`, {
          method: 'POST',
          headers: {
            'X-Parse-Application-Id': BACK4APP_CONFIG.appId,
            'X-Parse-REST-API-Key': BACK4APP_CONFIG.restKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tripId }),
        });

        const data = await response.json();

        if (data.result) {
          const fetchedStops: ItineraryStop[] = data.result.stops || [];
          const fetchedShapes: ShapePoint[] = data.result.shapes || [];

          stopsRef.current = fetchedStops;
          shapesRef.current = fetchedShapes;

          setStops(fetchedStops);
          setShapes(fetchedShapes);

          if (fetchedShapes.length > 0 || fetchedStops.some((s) => s.location !== null)) {
            setTimeout(() => {
              fitRouteToMap(true, fetchedShapes, fetchedStops);
            }, 300);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar itinerário da linha:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchItinerary();
  }, [tripId]);

  // Busca todas as viagens da linha para calcular primeira, última e intervalo médio
  useEffect(() => {
    if (!id) {
      setLoadingSchedules(false);
      return;
    }

    async function fetchRouteTrips() {
      setLoadingSchedules(true);
      try {
        const whereQuery = { route_id: String(id) };
        const res = await fetch(
          `${BACK4APP_CONFIG.baseUrl}/classes/Trips?where=${encodeURIComponent(
            JSON.stringify(whereQuery),
          )}&limit=1000`,
          {
            headers: {
              'X-Parse-Application-Id': BACK4APP_CONFIG.appId,
              'X-Parse-REST-API-Key': BACK4APP_CONFIG.restKey,
            },
          },
        );
        const data = await res.json();
        if (data.results) {
          setRouteTrips(data.results);
        }
      } catch (error) {
        console.error('Erro ao buscar horários da linha:', error);
      } finally {
        setLoadingSchedules(false);
      }
    }

    fetchRouteTrips();
  }, [id]);

  // Sentido da viagem atual ("IDA" ou "VOLTA") para não misturar intervalos dos dois sentidos
  const activeDirection = useMemo(() => {
    if (tripId) {
      const parsed = parseTripMetadata(String(tripId));
      if (parsed?.direction) return parsed.direction;
    }
    return 'IDA';
  }, [tripId]);

  // Calcula primeira viagem, última viagem e intervalo médio para o dia selecionado
  const scheduleSummary: ScheduleSummary | null = useMemo(() => {
    if (routeTrips.length === 0) return null;

    const parsedTrips = routeTrips
      .map((t) => parseTripMetadata(t.trip_id))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Filtra pelo tipo de dia escolhido e sentido da viagem atual
    let matching = parsedTrips.filter(
      (t) => t.dayType === selectedDay && t.direction === activeDirection,
    );

    // Fallback caso a linha só tenha viagens em um sentido ou outro
    if (matching.length === 0) {
      matching = parsedTrips.filter((t) => t.dayType === selectedDay);
    }

    if (matching.length === 0) return null;

    const uniqueMinutes = Array.from(new Set(matching.map((t) => t.departureMinutes))).sort(
      (a, b) => a - b,
    );

    const first = uniqueMinutes[0];
    const last = uniqueMinutes[uniqueMinutes.length - 1];
    const avgInterval =
      uniqueMinutes.length > 1
        ? Math.round((last - first) / (uniqueMinutes.length - 1))
        : 0;

    return {
      primeira: formatMinutes(first),
      ultima: formatMinutes(last),
      intervaloMedio: uniqueMinutes.length > 1 ? `~${avgInterval} min` : 'Viagem única',
      totalViagens: uniqueMinutes.length,
    };
  }, [routeTrips, selectedDay, activeDirection]);

  const formatShortAddress = (rawAddress: string) => {
    if (!rawAddress) return 'Endereço não mapeado';
    const parts = rawAddress.split(',');
    return parts.slice(0, 3).join(',').trim();
  };

  const handleMarkerPress = (stop: ItineraryStop, index: number) => {
    setSelectedStopId(stop.stop_id);

    if (lastOffset.current !== 0) {
      animateSheetTo(0);
    }

    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.3,
    });

    setTimeout(() => {
      fitRouteToMap(true);
    }, 150);
  };

  const handleFocusStopOnMap = (stop: ItineraryStop, index: number) => {
    setSelectedStopId(stop.stop_id);
    markerRefs.current[`${stop.stop_id}-${index}`]?.showCallout();
    fitRouteToMap(lastOffset.current === 0);
  };

  return (
    <View style={styles.container}>
      {/* MAPA EM TELA CHEIA NO FUNDO */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: -8.0476,
          longitude: -34.877,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {shapes.length > 0 && (
          <Polyline
            coordinates={shapes}
            strokeColor={colors.brand}
            strokeWidth={4}
          />
        )}

        {stops.map((stop, index) => {
          if (!stop.location) return null;
          const latitude = Number(stop.location.latitude);
          const longitude = Number(stop.location.longitude);
          if (isNaN(latitude) || isNaN(longitude)) return null;

          return (
            <Marker
              ref={(ref) => {
                markerRefs.current[`${stop.stop_id}-${index}`] = ref;
              }}
              key={`${stop.stop_id}-${index}`}
              coordinate={{ latitude, longitude }}
              title={`${index + 1}. Parada ${stop.stop_id}`}
              description={formatShortAddress(stop.address)}
              onPress={() => handleMarkerPress(stop, index)}
            >
              <Image
                source={require('../../../assets/figma.icons/bus-stop.png')}
                style={{ width: 38, height: 46 }}
                resizeMode="contain"
              />
            </Marker>
          );
        })}
      </MapView>

      {/* Botão flutuante de Voltar respeitando a altura da barra de status */}
      <Pressable
        style={({ pressed }) => [
          SharedStyles.floatingBackButton,
          styles.backButtonPosition,
          { top: insets.top + 12 },
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>

      {/* PAINEL INFERIOR ARRASTÁVEL */}
      <Animated.View
        style={[
          styles.sheetContainer,
          { paddingBottom: insets.bottom },
          { transform: [{ translateY }] },
        ]}
      >
        <View {...panResponder.panHandlers}>
          <Pressable style={styles.handleTouchArea} onPress={toggleSheet}>
            <View style={styles.dragHandle} />
          </Pressable>

          {/* Cabeçalho da linha com botão de Favoritar */}
          <View style={styles.routeHeader}>
            <View style={styles.badgeRow}>
              <View style={SharedStyles.routeBadge}>
                <Text style={styles.routeBadgeText}>{id}</Text>
              </View>
              {headsign ? (
                <Text style={styles.headsignText} numberOfLines={1}>
                  Sentido: {headsign} ({activeDirection})
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.favoriteButton,
                  favorited && styles.favoriteButtonActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() =>
                  toggleFavorite({
                    routeId: String(id),
                    nome: longName || `Linha ${id}`,
                    headsign: headsign || '',
                    tripId: tripId || '',
                  })
                }
              >
                <Ionicons
                  name={favorited ? 'star' : 'star-outline'}
                  size={22}
                  color={favorited ? colors.favorite : colors.textMuted}
                />
              </Pressable>
            </View>
            <Text style={styles.routeTitle} numberOfLines={2}>
              {longName || `Linha ${id}`}
            </Text>
          </View>
        </View>

        {/* Bloco de Horários de Saída: Primeira, Última e Intervalo Médio */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleTitleRow}>
              <Ionicons name="time-outline" size={16} color={colors.brand} />
              <Text style={styles.scheduleTitle}>Horários de Saída</Text>
            </View>
            <View style={styles.dayTabs}>
              {(
                [
                  { key: 'DUT', label: 'Úteis' },
                  { key: 'SAB', label: 'Sáb' },
                  { key: 'DOM', label: 'Dom' },
                ] as const
              ).map((dia) => {
                const ativo = selectedDay === dia.key;
                return (
                  <Pressable
                    key={dia.key}
                    style={[styles.dayTab, ativo && styles.dayTabActive]}
                    onPress={() => setSelectedDay(dia.key)}
                  >
                    <Text style={[styles.dayTabText, ativo && styles.dayTabTextActive]}>
                      {dia.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {loadingSchedules ? (
            <ActivityIndicator size="small" color={colors.brand} style={{ paddingVertical: 8 }} />
          ) : scheduleSummary ? (
            <View style={styles.scheduleStatsRow}>
              <View style={styles.scheduleStatBox}>
                <Text style={styles.scheduleStatLabel}>Primeira viagem</Text>
                <Text style={styles.scheduleStatValue}>{scheduleSummary.primeira}</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleStatBox}>
                <Text style={styles.scheduleStatLabel}>Última viagem</Text>
                <Text style={styles.scheduleStatValue}>{scheduleSummary.ultima}</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleStatBox}>
                <Text style={styles.scheduleStatLabel}>Intervalo médio</Text>
                <Text style={[styles.scheduleStatValue, { color: colors.brand }]}>
                  {scheduleSummary.intervaloMedio}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.scheduleEmptyText}>
              Sem viagens programadas para este dia.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Itinerário ({stops.length} paradas)
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 24 }} />
        ) : stops.length === 0 ? (
          <View style={SharedStyles.emptyContainer}>
            <Text style={SharedStyles.emptyText}>
              Nenhuma parada encontrada para esta viagem.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={stops}
            keyExtractor={(item, index) => `${item.stop_id}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.3,
                });
              }, 100);
            }}
            renderItem={({ item, index }) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;
              const isSelected = selectedStopId === item.stop_id;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.stopRow,
                    isSelected && styles.stopRowSelected,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleFocusStopOnMap(item, index)}
                >
                  <View style={styles.timelineColumn}>
                    <View
                      style={[
                        styles.timelineLineTop,
                        isFirst && { backgroundColor: 'transparent' },
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineDot,
                        (isFirst || isLast) && styles.timelineDotEndpoint,
                        isSelected && styles.timelineDotSelected,
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineLineBottom,
                        isLast && { backgroundColor: 'transparent' },
                      ]}
                    />
                  </View>

                  <View style={styles.stopInfo}>
                    <Text style={styles.stopAddress} numberOfLines={2}>
                      {formatShortAddress(item.address)}
                    </Text>
                    <Text style={styles.stopCode}>
                      Parada #{item.stop_id} • Sequência {index + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  backButtonPosition: {
    position: 'absolute',
    left: 16,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_MAX_HEIGHT,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
  },
  handleTouchArea: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  routeHeader: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  routeBadgeText: {
    color: colors.brandText,
    fontWeight: 'bold',
    fontSize: 15,
  },
  headsignText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#FEF9C3',
  },
  routeTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scheduleCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 2,
    gap: 2,
  },
  dayTab: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  dayTabActive: {
    backgroundColor: colors.brand,
  },
  dayTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayTabTextActive: {
    color: colors.brandText,
    fontWeight: 'bold',
  },
  scheduleStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  scheduleStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  scheduleStatValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scheduleDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  scheduleEmptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  stopRowSelected: {
    backgroundColor: colors.brandSoft,
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineLineTop: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textMuted,
  },
  timelineDotEndpoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand,
  },
  timelineDotSelected: {
    backgroundColor: colors.brand,
    transform: [{ scale: 1.25 }],
  },
  stopInfo: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stopAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stopCode: {
    fontSize: 12,
    color: colors.textMuted,
  },
});


