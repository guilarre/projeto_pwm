import React, { useEffect, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACK4APP_CONFIG } from '@/config/back4app';
import { useFavorites } from '@/hooks/useFavorites';
import { BusTheme } from '@/constants/theme';

const { colors, radius } = BusTheme;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Alturas do painel inferior (expandido vs recolhido)
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.62;
const SHEET_MIN_HEIGHT = 150;
const MAX_TRANSLATE_Y = SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT;

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

export default function BusDetailScreen() {
    const { id, longName, headsign, tripId } = useLocalSearchParams<{
        id: string;
        longName?: string;
        headsign?: string;
        tripId?: string;
    }>();

    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const favorited = isFavorite(String(id));

    const mapRef = useRef<MapView | null>(null);
    const flatListRef = useRef<FlatList<ItineraryStop> | null>(null);
    const markerRefs = useRef<Record<string, React.ComponentRef<typeof Marker> | null>>({});

    const [stops, setStops] = useState<ItineraryStop[]>([]);
    const [shapes, setShapes] = useState<ShapePoint[]>([]);
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const stopsRef = useRef<ItineraryStop[]>([]);
    const shapesRef = useRef<ShapePoint[]>([]);

    // Controle da animação do Bottom Sheet (0 = expandido, MAX_TRANSLATE_Y = recolhido)
    const translateY = useRef(new Animated.Value(0)).current;
    const lastOffset = useRef(0);

    const fitRouteToMap = (
        isSheetOpen: boolean,
        currentShapes: ShapePoint[] = shapesRef.current,
        currentStops: ItineraryStop[] = stopsRef.current
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
        })
    ).current;

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

            {/* Botão flutuante de Voltar */}
            <Pressable
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>

            {/* PAINEL INFERIOR ARRASTÁVEL */}
            <Animated.View
                style={[
                    styles.sheetContainer,
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
                            <View style={styles.routeBadge}>
                                <Text style={styles.routeBadgeText}>{id}</Text>
                            </View>
                            {headsign ? (
                                <Text style={styles.headsignText} numberOfLines={1}>
                                    Sentido: {headsign}
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

                <Text style={styles.sectionTitle}>
                    Itinerário ({stops.length} paradas)
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 32 }} />
                ) : stops.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
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
    backButton: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
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
        marginBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        paddingBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 10,
    },
    routeBadge: {
        backgroundColor: colors.brand,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: radius.full,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    sectionTitle: {
        fontSize: 16,
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
    emptyContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
    },
});