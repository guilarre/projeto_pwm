import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Pressable,
    Image,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // CHECK: ver se mantemos assim ou com o definido no figma
import { BACK4APP_CONFIG } from '@/config/back4app';

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
    const mapRef = useRef<MapView | null>(null);

    const [stops, setStops] = useState<ItineraryStop[]>([]);
    const [shapes, setShapes] = useState<ShapePoint[]>([]);
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

                    setStops(fetchedStops);
                    setShapes(fetchedShapes);

                    // Enquadra automaticamente o traçado ou as paradas na tela
                    const coordsToFit =
                        fetchedShapes.length > 0
                            ? fetchedShapes
                            : fetchedStops
                                  .filter((s) => s.location !== null)
                                  .map((s) => ({
                                      latitude: Number(s.location!.latitude),
                                      longitude: Number(s.location!.longitude),
                                  }));

                    if (coordsToFit.length > 0) {
                        setTimeout(() => {
                            mapRef.current?.fitToCoordinates(coordsToFit, {
                                edgePadding: { top: 70, right: 50, bottom: 50, left: 50 },
                                animated: true,
                            });
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

    // Formata o endereço longo do Nominatim até a 2ª vírgula
    const formatShortAddress = (rawAddress: string) => {
        if (!rawAddress) return 'Endereço não mapeado';
        const parts = rawAddress.split(',');
        return parts.slice(0, 3).join(',').trim();
    };

    // Centraliza o mapa ao clicar em uma parada da lista
    const handleFocusStopOnMap = (stop: ItineraryStop) => {
        setSelectedStopId(stop.stop_id);
        if (stop.location && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: Number(stop.location.latitude),
                    longitude: Number(stop.location.longitude),
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                },
                500
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* METADE SUPERIOR: Mapa com o trajeto e os markers das paradas */}
            {/* SECTION: PARTE SUPERIOR: map view */}
            <View style={styles.mapWrapper}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: -8.0476,
                        longitude: -34.877,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    }}
                >
                    {/* Linha do trajeto (se houver pontos na tabela Shapes) */}
                    {shapes.length > 0 && (
                        <Polyline
                            coordinates={shapes}
                            strokeColor="#007AFF"
                            strokeWidth={4}
                        />
                    )}

                    {/* Marcadores de todas as paradas do itinerário */}
                    {stops.map((stop, index) => {
                        if (!stop.location) return null;
                        const latitude = Number(stop.location.latitude);
                        const longitude = Number(stop.location.longitude);
                        if (isNaN(latitude) || isNaN(longitude)) return null;

                        return (
                            <Marker
                                key={`${stop.stop_id}-${index}`}
                                coordinate={{ latitude, longitude }}
                                title={`${index + 1}. Parada ${stop.stop_id}`}
                                description={formatShortAddress(stop.address)}
                                onPress={() => setSelectedStopId(stop.stop_id)}
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

                {/* SECTION: Botão flutuante de Voltar */}
                <Pressable
                    style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </Pressable>
            </View>

            {/* SECTION: PARTE INFERIOR: Painel estilo Bottom Sheet com detalhes e itinerário */}
            <View style={styles.sheetContainer}>
                {/* TODO: falta a funcionalidade ainda do handle */}
                <View style={styles.dragHandle} />

                {/* Cabeçalho da linha */}
                <View style={styles.routeHeader}>
                    <View style={styles.badgeRow}>
                        <View style={styles.routeBadge}>
                            <Text style={styles.routeBadgeText}>{id}</Text>
                        </View>
                        {headsign ? (
                            <Text style={styles.headsignText} numberOfLines={1}>
                                Sentido: {headsign}
                            </Text>
                        ) : null}
                    </View>
                    <Text style={styles.routeTitle} numberOfLines={2}>
                        {longName || `Linha ${id}`}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>
                    Itinerário ({stops.length} paradas)
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
                ) : stops.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Nenhuma parada encontrada para esta viagem.
                        </Text>
                    </View>
                ) : (
                    // SECTION: lista do itinerário
                    <FlatList
                        data={stops}
                        keyExtractor={(item, index) => `${item.stop_id}-${index}`}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
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
                                    onPress={() => handleFocusStopOnMap(item)}
                                >
                                    {/* Linha do tempo vertical conectando as paradas */}
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

                                    {/* Informações da parada */}
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapWrapper: {
        height: '42%',
        width: '100%',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    sheetContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginBottom: 14,
    },
    routeHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 10,
    },
    routeBadge: {
        backgroundColor: '#6B7280',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 16,
    },
    routeBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    headsignText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        flex: 1,
    },
    routeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
        marginBottom: 8,
    },
    listContent: {
        paddingBottom: 24,
    },
    stopRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    stopRowSelected: {
        backgroundColor: '#F0F7FF',
    },
    timelineColumn: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
    },
    timelineLineTop: {
        width: 2,
        flex: 1,
        backgroundColor: '#CBD5E1',
    },
    timelineLineBottom: {
        width: 2,
        flex: 1,
        backgroundColor: '#CBD5E1',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#94A3B8',
    },
    timelineDotEndpoint: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
    },
    timelineDotSelected: {
        backgroundColor: '#FF3B30',
        transform: [{ scale: 1.2 }],
    },
    stopInfo: {
        flex: 1,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stopAddress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
        marginBottom: 2,
    },
    stopCode: {
        fontSize: 12,
        color: '#777',
    },
    emptyContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
    },
});
