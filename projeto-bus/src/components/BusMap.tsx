import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

const APP_ID = process.env.EXPO_PUBLIC_BACK4APP_APP_ID;
const REST_KEY = process.env.EXPO_PUBLIC_BACK4APP_APP_REST_KEY;
// limite mínimo de 600m em graus de latitude (600m / 111111m =~ 0.0054)
const MAX_LATITUDE_DELTA = 0.0054;

interface Stop {
    objectId: string;
    stop_id: string;
    stop_name: string;
    stop_lat: string;
    stop_lon: string;
}

export function BusMap() {
    const [stops, setStops] = useState<Stop[]>([]);
    const [loading, setLoading] = useState(false);

    // Região inicial centralizada em Recife
    const initialRegion: Region = {
        latitude: -8.0476,
        longitude: -34.8770,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    // Função chamada sempre que o usuário solta o mapa ou termina o zoom
    const handleRegionChangeComplete = async (region: Region) => {
        // Pra evitar consultas excessivas quando o zoom está muito distante (min 600m)
        if (region.latitudeDelta > MAX_LATITUDE_DELTA) {
            setStops([]);
            return;
        }

        setLoading(true);

        // 1. Calcula a área visível no mapa
        const minLat = (region.latitude - region.latitudeDelta / 2).toString();
        const maxLat = (region.latitude + region.latitudeDelta / 2).toString();
        const minLon = (region.longitude - region.longitudeDelta / 2).toString();
        const maxLon = (region.longitude + region.longitudeDelta / 2).toString();

        // 2. Monta a query para buscar apenas as paradas dentro desse retângulo no Back4App
        const whereQuery = {
            stop_lat: { $gte: minLat, $lte: maxLat },
            stop_lon: { $gte: minLon, $lte: maxLon },
        };

        try {
            const url = `https://parseapi.back4app.com/classes/Stops?where=${encodeURIComponent(
                JSON.stringify(whereQuery)
            )}&limit=100`;

            const response = await fetch(url, {
                headers: {
                    'X-Parse-Application-Id': `${APP_ID}`,
                    'X-Parse-REST-API-Key': `${REST_KEY}`,
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

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                {stops.map((stop) => {
                    const latitude = Number(stop.stop_lat);
                    const longitude = Number(stop.stop_lon);

                    if (isNaN(latitude) || isNaN(longitude)) return null;

                    return (
                        <Marker
                            key={stop.objectId}
                            coordinate={{ latitude, longitude }}
                            title={stop.stop_name}
                            description={`ID: ${stop.stop_id}`}
                        />
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
});
