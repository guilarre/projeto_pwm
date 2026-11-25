import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Image, Platform } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACK4APP_CONFIG } from '@/config/back4app';

// limite mínimo de 1km em graus de latitude (2000m / 111111m =~ 0.018)
const MAX_LATITUDE_DELTA = 0.018;

interface Stop {
    objectId: string;
    stop_id: string;
    stop_name: string;
    lat: number;
    lon: number;
}

export function BusMap() {
    const [stops, setStops] = useState<Stop[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Região inicial centralizada em Bairro Novo (Olinda) com zoom suficiente para exibir paradas (< 0.009)
    const initialRegion: Region = {
        latitude: -8.000402,
        longitude: -34.839964,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
    };

    // Carrega as paradas logo ao abrir a tela no celular
    useEffect(() => {
        if (Platform.OS !== 'web') {
            handleRegionChangeComplete(initialRegion);
        }
    }, []);

    // Função chamada sempre que o usuário solta o mapa ou termina o zoom
    const handleRegionChangeComplete = async (region: Region) => {
        // Pra evitar consultas excessivas quando o zoom está muito distante (min 600m)
        if (region.latitudeDelta > MAX_LATITUDE_DELTA) {
            setStops([]);
            return;
        }

        setLoading(true);

        // 1. Calcula a área visível no mapa
        const minLat = (region.latitude - region.latitudeDelta / 2);
        const maxLat = (region.latitude + region.latitudeDelta / 2);
        const minLon = (region.longitude - region.longitudeDelta / 2);
        const maxLon = (region.longitude + region.longitudeDelta / 2);

        // 2. Monta a query para buscar apenas as paradas dentro desse retângulo no Back4App
        const whereQuery = {
            lat: { $gte: minLat, $lte: maxLat },
            lon: { $gte: minLon, $lte: maxLon },
        };

        try {
            const url = `${BACK4APP_CONFIG.baseUrl}/classes/Stops?where=${encodeURIComponent(
                JSON.stringify(whereQuery)
            )}&limit=100`;

            const response = await fetch(url, {
                headers: {
                    'X-Parse-Application-Id': `${BACK4APP_CONFIG.appId}`,
                    'X-Parse-REST-API-Key': `${BACK4APP_CONFIG.restKey}`,
                },
            });

            const data = await response.json();
            if (data.results) {
                setStops(data.results);
            }
        } catch (error) {
            console.error('Erro ao buscar paradas da região:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fallback amigável caso o usuário abra no navegador Web (PC)
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, styles.webFallbackContainer]}>
                <Ionicons name="map" size={56} color="#27ae60" />
                <Text style={styles.webFallbackTitle}>Mapa Interativo (Recife/Olinda)</Text>
                <Text style={styles.webFallbackText}>
                    O mapa utiliza a biblioteca nativa Google Maps/Apple Maps do dispositivo móvel. Abra o app no celular pelo Expo Go para ver todas as paradas interativas em tempo real!
                </Text>
                <View style={styles.webTipBox}>
                    <Text style={styles.webTipText}>
                        💡 Dica: A aba "Linhas" funciona 100% no navegador!
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                {stops.map((stop) => {
                    const latitude = Number(stop.lat);
                    const longitude = Number(stop.lon);

                    if (isNaN(latitude) || isNaN(longitude)) return null;

                    return (
                        <Marker
                            key={stop.objectId}
                            coordinate={{ latitude, longitude }}
                            onPress={(e) => {
                                e.stopPropagation(); //evita comportamento padrão do mapa
                                router.push({
                                    pathname: `/stop/${stop.objectId}` as any,
                                    params: {
                                        stopId: stop.stop_id
                                    }
                                });
                            }}
                        >
                            <Image
                                source={require('../../assets/figma.icons/bus-stop.png')}
                                style={{ width: 44, height: 52 }}
                                resizeMode="contain"
                            />
                        </Marker>
                    );
                })}
            </MapView>

            {/* Aviso visual sutil orientando o usuário a aproximar o zoom se necessário */}
            {stops.length === 0 && !loading && (
                <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>Aproxime o zoom para ver os pontos de ônibus</Text>
                </View>
            )}

            {/* Indicador visual discreto enquanto o mapa move e carrega novas paradas */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#0000ff" />
                    <Text style={styles.loadingText}>Buscando paradas...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    loadingContainer: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 3,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: 'bold',
    },
    hintContainer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 3,
    },
    hintText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    webFallbackContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f8f9fa',
    },
    webFallbackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginTop: 12,
    },
    webFallbackText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 340,
        lineHeight: 18,
    },
    webTipBox: {
        marginTop: 20,
        backgroundColor: '#e8f8f0',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a3e4d7',
    },
    webTipText: {
        fontSize: 12,
        color: '#1e8449',
        fontWeight: '600',
    },
});
